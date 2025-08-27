import { CalendarEvent } from "../../../../types/calendar";

// Note: Status type should be defined in calendar.ts
type Status = "confirmed" | "tentative" | "cancelled";

interface TransitionScenario {
    title: string;
    options: Array<{
        label: string;
        value: string;
        description?: string;
    }>;
}

interface ValidationResult {
    isValid: boolean;
    message?: string;
}

export const getTransitionScenarios = (from: Status, to: Status, event: CalendarEvent): TransitionScenario[] => {
    const scenarios: TransitionScenario[] = [];

    const hasIncompleteRequiredSubtasks = (event: CalendarEvent): boolean => {
        if (!event.subtasks) return false;
        return event.subtasks.some(
            (subtask) => subtask.requiredCompleted && !subtask.completed
        );
    };


    // Check for incomplete required subtasks when transitioning to confirmed
    if (to === "confirmed" && hasIncompleteRequiredSubtasks(event)) {
        scenarios.push({
            title: "Incomplete Required Subtasks",
            options: [
                {
                    label: "Some required subtasks are not completed",
                    value: "invalid",
                    description: "Complete all required subtasks before confirming"
                },
                { label: "Cancel", value: "cancel" },
            ],
        });
        return scenarios;
    }

    // Pre-validation for impossible transitions
    const validation = validateTransition(event, from, to);
    if (!validation.isValid) {
        scenarios.push({
            title: "Invalid Transition",
            options: [
                {
                    label: validation.message || "Cannot perform this transition",
                    value: "invalid",
                    description: "This status change is not allowed given current event data"
                },
                { label: "Cancel", value: "cancel" },
            ],
        });
        return scenarios;
    }

    // Check for missing required fields when transitioning to confirmed
    if (to === "confirmed") {
        const hasRequiredFields = event.startTime && event.startDate;

        if (!hasRequiredFields) {
            scenarios.push({
                title: "Missing Required Fields",
                options: [
                    {
                        label: "Set start time to now",
                        value: "set_start_to_now",
                        description: "Set start date and time to current time"
                    },
                    {
                        label: "Cancel transition",
                        value: "cancel"
                    }
                ]
            });
            return scenarios;
        }
    }

    switch (`${from}-${to}`) {
        // TENTATIVE to CONFIRMED
        case "tentative-confirmed":
            if (!event.startDate || !event.startTime) {
                scenarios.push({
                    title: "Missing Start Time",
                    options: [
                        {
                            label: "Set start time to now",
                            value: "set_start_now",
                            description: "Set event start time to current time"
                        },
                        {
                            label: "Set custom start time",
                            value: "set_custom_start",
                            description: "Choose specific start date and time"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else {
                scenarios.push({
                    title: "Confirm Event",
                    options: [
                        { label: "Confirm event", value: "confirm" },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        // CONFIRMED to TENTATIVE
        case "confirmed-tentative":
            scenarios.push({
                title: "Make Tentative",
                options: [
                    {
                        label: "Mark as tentative",
                        value: "make_tentative",
                        description: "Change event status to tentative"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        // CONFIRMED/TENTATIVE to CANCELLED
        case "confirmed-cancelled":
        case "tentative-cancelled":
            scenarios.push({
                title: "Cancel Event",
                options: [
                    {
                        label: "Cancel event",
                        value: "cancel_event",
                        description: "Mark event as cancelled"
                    },
                    {
                        label: "Cancel and notify",
                        value: "cancel_and_notify",
                        description: "Cancel event and send notifications"
                    },
                    { label: "Don't cancel", value: "cancel" },
                ],
            });
            break;

        // CANCELLED to CONFIRMED/TENTATIVE
        case "cancelled-confirmed":
            scenarios.push({
                title: "Restore Event",
                options: [
                    {
                        label: "Restore and confirm",
                        value: "restore_confirm",
                        description: "Restore event and mark as confirmed"
                    },
                    {
                        label: "Update event details",
                        value: "restore_update",
                        description: "Restore and update event information"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "cancelled-tentative":
            scenarios.push({
                title: "Restore as Tentative",
                options: [
                    {
                        label: "Restore as tentative",
                        value: "restore_tentative",
                        description: "Restore event with tentative status"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        default:
            // Generic transition
            scenarios.push({
                title: "Change Status",
                options: [
                    {
                        label: `Change to ${to}`,
                        value: "change_status",
                        description: `Update event status to ${to}`
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;
    }

    return scenarios;
};

const validateTransition = (event: CalendarEvent, from: Status, to: Status): ValidationResult => {
    // Add validation logic here if needed
    // For now, all transitions are valid
    return { isValid: true };
};

export const executeStatusTransition = (
    event: CalendarEvent,
    oldStatus: Status,
    newStatus: Status,
    selectedOptions: Record<string, string>,
    isCreateMode: boolean
): CalendarEvent | { error: string } => {
    // Pre-validation
    const validation = validateTransition(event, oldStatus, newStatus);
    if (!validation.isValid) {
        return { error: validation.message || "Invalid transition" };
    }

    // Check for invalid options
    for (const [, value] of Object.entries(selectedOptions)) {
        if (value === "invalid") {
            return { error: "Cannot perform this transition with current event data" };
        }
    }

    const now = new Date();
    let updatedEvent = { ...event };
    const currentDateTime = now;

    // Handle missing actual start time when transitioning to confirmed
    if (newStatus === "confirmed") {
        if (selectedOptions["set_start_to_now"] === "set_start_to_now" || selectedOptions["set_start_now"] === "set_start_now") {
            updatedEvent.startDate = currentDateTime;
            updatedEvent.startTime = currentDateTime;
            updatedEvent.actualStartDate = currentDateTime;
            updatedEvent.actualStartTime = currentDateTime;
        }
    }

    // Handle specific transitions
    switch (`${oldStatus}-${newStatus}`) {
        case "tentative-confirmed":
            if (selectedOptions["set_custom_start"] === "set_custom_start") {
                // This would typically open a date/time picker
                // For now, we'll set it to current time
                updatedEvent.startDate = currentDateTime;
                updatedEvent.startTime = currentDateTime;
            }
            break;

        case "confirmed-cancelled":
        case "tentative-cancelled":
            // Add cancellation timestamp if needed
            updatedEvent.actualEndDate = currentDateTime;
            updatedEvent.actualEndTime = currentDateTime;
            break;

        case "cancelled-confirmed":
            if (selectedOptions["restore_confirm"] === "restore_confirm") {
                updatedEvent.actualEndDate = null;
                updatedEvent.actualEndTime = null;
                // Ensure start time is set
                if (!updatedEvent.startDate) {
                    updatedEvent.startDate = currentDateTime;
                    updatedEvent.startTime = currentDateTime;
                }
            }
            break;

        case "cancelled-tentative":
            updatedEvent.actualEndDate = null;
            updatedEvent.actualEndTime = null;
            break;
    }

    // Add activity log entry if not in create mode
    if (!isCreateMode) {
        const activityEntry = {
            id: `${currentDateTime.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
            details: `Status changed from "${oldStatus}" to "${newStatus}"`,
            action: "status_changed" as const,
            userId: "user",
            timestamp: currentDateTime,
        };
        // Note: activityLog is not defined in CalendarEvent interface
        // This would need to be added to the interface if needed
        // updatedEvent.activityLog = [...(updatedEvent.activityLog || []), activityEntry];
    }

    return updatedEvent as CalendarEvent;
};

export const formatDisplayDate = (date: Date | null) => {
    if (!date) return "Select date";
    return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export const formatDisplayTime = (time: Date | null) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

// Helper function to check if transition requires form input
export const requiresUserInput = (from: Status, to: Status, event: CalendarEvent): boolean => {
    const scenarios = getTransitionScenarios(from, to, event);
    return scenarios.some(scenario =>
        scenario.options.some(option =>
            option.value === "set_custom_start" ||
            option.value === "restore_update"
        )
    );
};

// Helper function to get suggested alternative transitions
export const getSuggestedAlternatives = (from: Status, to: Status, event: CalendarEvent): Status[] => {
    const scenarios = getTransitionScenarios(from, to, event);
    const suggestions: Status[] = [];

    scenarios.forEach(scenario => {
        scenario.options.forEach(option => {
            if (option.value === "restore_tentative") {
                suggestions.push("tentative");
            }
        });
    });

    return suggestions;
};

export const getSuggestedStatusFromDates = (event: CalendarEvent): Status | null => {
    const now = new Date();
    const startDate = event.startDate;
    const dueDate = event.dueDate;

    // If event has passed and is still tentative, suggest confirmed
    if (startDate && startDate < now && (!event as any).status === 'tentative') {
        return 'confirmed';
    }

    // If event is in future and confirmed but has issues, suggest tentative
    if (startDate && startDate > now && (!event as any).status === 'confirmed') {
        // Check if there are incomplete required subtasks
        if (event.subtasks?.some(subtask => subtask.requiredCompleted && !subtask.completed)) {
            return 'tentative';
        }
    }

    return null;
};