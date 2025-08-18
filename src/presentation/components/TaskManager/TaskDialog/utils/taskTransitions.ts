import { Task, Status } from "../../../../types/task";

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

export const getTransitionScenarios = (from: Status, to: Status, task: Task): TransitionScenario[] => {
    const now = new Date();
    const scenarios: TransitionScenario[] = [];

    // Helper functions
    const isPastDate = (date: Date | null) => date && new Date(date) < now;
    const isFutureDate = (date: Date | null) => date && new Date(date) > now;

    const startDate = task.startDate ? new Date(task.startDate) : null;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    // Pre-validation for impossible transitions
    const validation = validateTransition(task, from, to);
    if (!validation.isValid) {
        scenarios.push({
            title: "Invalid Transition",
            options: [
                {
                    label: validation.message || "Cannot perform this transition",
                    value: "invalid",
                    description: "This status change is not allowed given current task data"
                },
                { label: "Cancel", value: "cancel" },
            ],
        });
        return scenarios;
    }

    switch (`${from}-${to}`) {
        // === OVERDUE TRANSITIONS ===
        case "overdue-backlog":
            scenarios.push({
                title: "Reset Task Data",
                options: [
                    {
                        label: "Reset actual times",
                        value: "reset",
                        description: "Clear all actual start/end times and return to unscheduled state"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "overdue-todo":
            if (!startDate || isPastDate(startDate)) {
                scenarios.push({
                    title: "Update Start Time",
                    options: [
                        {
                            label: "Set new future start time",
                            value: "update_start",
                            description: "Set start time to future to make task schedulable"
                        },
                        {
                            label: "Cancel",
                            value: "cancel"
                        },
                    ],
                });
            }
            break;

        case "overdue-in-progress":
            if (!task.actualStartDate) {
                scenarios.push({
                    title: "Start Time Recording",
                    options: [
                        {
                            label: "Record actual start time now",
                            value: "record_start",
                            description: "Begin working on this overdue task immediately"
                        },
                        {
                            label: "Cancel",
                            value: "cancel"
                        },
                    ],
                });
            }
            break;

        case "overdue-done":
            const overdueDoneScenarios = [];

            if (!task.actualStartDate) {
                overdueDoneScenarios.push({
                    title: "Missing Start Time",
                    options: [
                        {
                            label: "Auto-assign start time to now",
                            value: "auto_start",
                            description: "System will set start time to current time"
                        },
                        {
                            label: "Enter start time manually",
                            value: "manual_start",
                            description: "Specify when the task actually started"
                        },
                        {
                            label: "Cancel",
                            value: "cancel"
                        },
                    ],
                });
            }

            if (dueDate && isPastDate(dueDate)) {
                overdueDoneScenarios.push({
                    title: "Overdue Completion",
                    options: [
                        {
                            label: "Complete as overdue",
                            value: "complete_overdue",
                            description: "Mark as done with overdue flag"
                        },
                        {
                            label: "Update due date to now",
                            value: "update_due_to_now",
                            description: "Adjust due date to current time"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }

            scenarios.push(...overdueDoneScenarios);
            if (overdueDoneScenarios.length === 0) {
                scenarios.push({
                    title: "Complete Overdue Task",
                    options: [
                        { label: "Mark as completed", value: "complete" },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        // === DONE TRANSITIONS ===
        case "done-backlog":
            scenarios.push({
                title: "Reset Task Data",
                options: [
                    {
                        label: "Reset all time fields",
                        value: "reset",
                        description: "Clear all scheduling and actual times"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "done-todo":
            scenarios.push({
                title: "Reset Task Data",
                options: [
                    {
                        label: "Reset actual times and adjust start time",
                        value: "reset",
                        description: "Clear completion data and set future start time"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "done-in-progress":
            scenarios.push({
                title: "Reopen Task",
                options: [
                    {
                        label: "Keep actual start time",
                        value: "keep_start",
                        description: "Resume from previous start time"
                    },
                    {
                        label: "Reset actual start time",
                        value: "reset_start",
                        description: "Start fresh from current time"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "done-overdue":
            scenarios.push({
                title: "Reopen as Overdue",
                options: [
                    {
                        label: "Set due date in past",
                        value: "set_past_due",
                        description: "Make task overdue by setting past due date"
                    },
                    {
                        label: "Keep current due date",
                        value: "keep_due",
                        description: "Maintain existing due date if already past"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        // === IN-PROGRESS TRANSITIONS ===
        case "in-progress-backlog":
            scenarios.push({
                title: "Stop Work and Reset",
                options: [
                    {
                        label: "Reset to unscheduled state",
                        value: "reset_to_backlog",
                        description: "Clear all time data and return to backlog"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "in-progress-todo":
            if (!startDate || !isFutureDate(startDate)) {
                scenarios.push({
                    title: "Cannot Return to Todo",
                    options: [
                        {
                            label: "Task has already started",
                            value: "invalid",
                            description: "Use backlog instead to reset the task"
                        },
                        {
                            label: "Reset to backlog instead",
                            value: "suggest_backlog"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else {
                scenarios.push({
                    title: "Stop Work Confirmation",
                    options: [
                        {
                            label: "Reset actual times",
                            value: "reset",
                            description: "Stop work and return to scheduled state"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        case "in-progress-done":
            if (dueDate && isPastDate(dueDate)) {
                scenarios.push({
                    title: "Overdue Completion",
                    options: [
                        {
                            label: "Complete with overdue status",
                            value: "complete_overdue",
                            description: "Mark as done but note it was completed late"
                        },
                        {
                            label: "Update due date to now",
                            value: "update_due",
                            description: "Adjust due date to current completion time"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else {
                scenarios.push({
                    title: "Complete Task",
                    options: [
                        { label: "Mark as completed", value: "complete" },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        case "in-progress-overdue":
            scenarios.push({
                title: "Mark as Overdue",
                options: [
                    {
                        label: "Keep current due date",
                        value: "keep_due",
                        description: "Mark overdue with existing due date"
                    },
                    {
                        label: "Set new past due date",
                        value: "new_due",
                        description: "Set a specific past due date"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        // === TODO TRANSITIONS ===
        case "todo-backlog":
            scenarios.push({
                title: "Reset Task Data",
                options: [
                    {
                        label: "Reset all time fields",
                        value: "reset",
                        description: "Clear scheduling information"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "todo-in-progress":
            if (startDate && isFutureDate(startDate)) {
                scenarios.push({
                    title: "Early Start",
                    options: [
                        {
                            label: "Start now (early)",
                            value: "start_early",
                            description: "Begin task before scheduled start time"
                        },
                        {
                            label: "Reschedule start time to now",
                            value: "reschedule",
                            description: "Update planned start time to current time"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else {
                scenarios.push({
                    title: "Start Task",
                    options: [
                        { label: "Begin working now", value: "start_now" },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        case "todo-done":
            scenarios.push({
                title: "Complete Without Progress",
                options: [
                    {
                        label: "Auto-record start and end times",
                        value: "auto_record",
                        description: "Set both start and end time to now"
                    },
                    {
                        label: "Enter times manually",
                        value: "manual_times",
                        description: "Specify actual start and end times"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "todo-overdue":
            if (!dueDate) {
                scenarios.push({
                    title: "Missing Due Date",
                    options: [
                        {
                            label: "Set due date in past",
                            value: "set_past_due",
                            description: "Add a past due date to mark as overdue"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else if (!isPastDate(dueDate)) {
                scenarios.push({
                    title: "Cannot Mark as Overdue",
                    options: [
                        {
                            label: "Due date hasn't passed yet",
                            value: "invalid",
                            description: "Wait for due date or update due date to past"
                        },
                        {
                            label: "Set due date to past",
                            value: "force_past_due"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else {
                scenarios.push({
                    title: "Mark as Overdue",
                    options: [
                        { label: "Confirm overdue status", value: "confirm_overdue" },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        // === BACKLOG TRANSITIONS ===
        case "backlog-todo":
            if (!startDate) {
                scenarios.push({
                    title: "Schedule Task",
                    options: [
                        {
                            label: "Set future start time",
                            value: "set_start",
                            description: "Schedule when to begin this task"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else if (!isFutureDate(startDate)) {
                scenarios.push({
                    title: "Invalid Start Time",
                    options: [
                        {
                            label: "Set future start time",
                            value: "update_start",
                            description: "Start time must be in the future"
                        },
                        {
                            label: "Switch to in-progress instead",
                            value: "switch_to_progress",
                            description: "Start working on task immediately"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else {
                scenarios.push({
                    title: "Move to Scheduled",
                    options: [
                        { label: "Confirm scheduling", value: "confirm" },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        case "backlog-in-progress":
            scenarios.push({
                title: "Start Task Now",
                options: [
                    {
                        label: "Record actual start time",
                        value: "record_start",
                        description: "Begin working immediately"
                    },
                    {
                        label: "Set planned start time first",
                        value: "set_planned",
                        description: "Add scheduling information then start"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "backlog-done":
            scenarios.push({
                title: "Complete Task",
                options: [
                    {
                        label: "Auto-record start and end times",
                        value: "auto_record",
                        description: "Set both times to now (instant completion)"
                    },
                    {
                        label: "Enter times manually",
                        value: "manual_times",
                        description: "Specify when task was actually done"
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            break;

        case "backlog-overdue":
            if (!dueDate) {
                scenarios.push({
                    title: "Mark as Overdue",
                    options: [
                        {
                            label: "Set due date in past",
                            value: "set_past_due",
                            description: "Add past due date and required start time"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else if (!isPastDate(dueDate)) {
                scenarios.push({
                    title: "Cannot Mark as Overdue",
                    options: [
                        {
                            label: "Due date hasn't passed",
                            value: "invalid",
                            description: "Due date must be in the past"
                        },
                        {
                            label: "Update due date to past",
                            value: "force_past_due"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else {
                scenarios.push({
                    title: "Mark as Overdue",
                    options: [
                        { label: "Confirm overdue status", value: "confirm_overdue" },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;
    }

    return scenarios;
};

const validateTransition = (task: Task, from: Status, to: Status): ValidationResult => {
    const now = new Date();
    const startDate = task.startDate ? new Date(task.startDate) : null;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    switch (`${from}-${to}`) {
        case "in-progress-todo":
            if (startDate && startDate <= now) {
                return {
                    isValid: false,
                    message: "Cannot return to todo: task has already started"
                };
            }
            break;

        // Most transitions are allowed with user confirmation
        // This validation only blocks clearly impossible cases
    }

    return { isValid: true };
};

export const executeStatusTransition = (
    task: Task,
    oldStatus: Status,
    newStatus: Status,
    selectedOptions: Record<string, string>,
    isCreateMode: boolean
): Task | { error: string } => {
    // Pre-validation
    const validation = validateTransition(task, oldStatus, newStatus);
    if (!validation.isValid) {
        return { error: validation.message || "Invalid transition" };
    }

    // Check for invalid options
    for (const [key, value] of Object.entries(selectedOptions)) {
        if (value === "invalid") {
            return { error: "Cannot perform this transition with current task data" };
        }
    }

    const now = new Date();
    let updatedTask = { ...task, status: newStatus };
    const currentDateTime = now;

    // Handle transition OUT of old status (cleanup)
    switch (oldStatus) {
        case "in-progress":
            if (newStatus !== "done" && newStatus !== "overdue") {
                updatedTask.actualStartDate = null;
                updatedTask.actualStartTime = null;
            }
            break;
        case "done":
            if (newStatus !== "in-progress") {
                updatedTask.actualEndDate = null;
                updatedTask.actualEndTime = null;
            }
            break;
    }

    // Handle transition INTO new status with selected options
    switch (`${oldStatus}-${newStatus}`) {
        // === OVERDUE TRANSITIONS ===
        case "overdue-backlog":
            updatedTask.actualStartDate = null;
            updatedTask.actualStartTime = null;
            updatedTask.actualEndDate = null;
            updatedTask.actualEndTime = null;
            break;

        case "overdue-todo":
            updatedTask.actualStartDate = null;
            updatedTask.actualStartTime = null;
            updatedTask.actualEndDate = null;
            updatedTask.actualEndTime = null;

            if (selectedOptions["update_start"] === "update_start") {
                const futureDate = new Date(now.getTime() + 60 * 60 * 1000);
                updatedTask.startDate = futureDate;
                updatedTask.startTime = null;
            }
            break;

        case "overdue-in-progress":
            if (!updatedTask.actualStartDate || selectedOptions["record_start"] === "record_start") {
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
            }
            break;

        case "overdue-done":
            if (!updatedTask.actualStartDate) {
                if (selectedOptions["manual_start"] === "manual_start") {
                    // Actual start will be set from form data
                } else {
                    updatedTask.actualStartDate = currentDateTime;
                    updatedTask.actualStartTime = currentDateTime;
                }
            }
            updatedTask.actualEndDate = currentDateTime;
            updatedTask.actualEndTime = currentDateTime;

            if (selectedOptions["update_due_to_now"] === "update_due_to_now") {
                updatedTask.dueDate = currentDateTime;
                updatedTask.dueTime = null;
            }
            break;

        // === DONE TRANSITIONS ===
        case "done-backlog":
            updatedTask.startDate = null;
            updatedTask.startTime = null;
            updatedTask.dueDate = null;
            updatedTask.dueTime = null;
            updatedTask.actualStartDate = null;
            updatedTask.actualStartTime = null;
            updatedTask.actualEndDate = null;
            updatedTask.actualEndTime = null;
            break;

        case "done-todo":
            updatedTask.actualStartDate = null;
            updatedTask.actualStartTime = null;
            updatedTask.actualEndDate = null;
            updatedTask.actualEndTime = null;

            // Auto-adjust start time to future if needed
            if (!updatedTask.startDate || new Date(updatedTask.startDate) <= now) {
                const futureDate = new Date(now.getTime() + 60 * 60 * 1000);
                updatedTask.startDate = futureDate;
                updatedTask.startTime = null;
            }
            break;

        case "done-in-progress":
            updatedTask.actualEndDate = null;
            updatedTask.actualEndTime = null;

            if (selectedOptions["reset_start"] === "reset_start") {
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
            }
            // Auto-adjust planned start if needed
            if (!updatedTask.startDate || new Date(updatedTask.startDate) > now) {
                updatedTask.startDate = currentDateTime;
                updatedTask.startTime = null;
            }
            // Auto-adjust due date if it would cause immediate overdue
            if (updatedTask.dueDate && new Date(updatedTask.dueDate) < now) {
                const futureDate = new Date(now.getTime() + 60 * 60 * 1000);
                updatedTask.dueDate = futureDate;
                updatedTask.dueTime = null;
            }
            break;

        case "done-overdue":
            updatedTask.actualEndDate = null;
            updatedTask.actualEndTime = null;

            if (selectedOptions["set_past_due"] === "set_past_due") {
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            } else if (!updatedTask.dueDate || new Date(updatedTask.dueDate) > now) {
                // Force past due date if not already past
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            }
            break;

        // === IN-PROGRESS TRANSITIONS ===
        case "in-progress-backlog":
            updatedTask.startDate = null;
            updatedTask.startTime = null;
            updatedTask.dueDate = null;
            updatedTask.dueTime = null;
            updatedTask.actualStartDate = null;
            updatedTask.actualStartTime = null;
            break;

        case "in-progress-todo":
            if (selectedOptions["suggest_backlog"] === "suggest_backlog") {
                // Redirect to backlog transition
                return executeStatusTransition(task, oldStatus, "backlog", {}, isCreateMode);
            }
            updatedTask.actualStartDate = null;
            updatedTask.actualStartTime = null;
            break;

        case "in-progress-done":
            updatedTask.actualEndDate = currentDateTime;
            updatedTask.actualEndTime = currentDateTime;

            if (selectedOptions["update_due"] === "update_due") {
                updatedTask.dueDate = currentDateTime;
                updatedTask.dueTime = null;
            }
            break;

        case "in-progress-overdue":
            if (selectedOptions["new_due"] === "new_due") {
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            } else if (!updatedTask.dueDate || new Date(updatedTask.dueDate) > now) {
                // Force past due date
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            }
            break;

        // === TODO TRANSITIONS ===
        case "todo-backlog":
            updatedTask.startDate = null;
            updatedTask.startTime = null;
            updatedTask.dueDate = null;
            updatedTask.dueTime = null;
            break;

        case "todo-in-progress":
            if (selectedOptions["start_early"] === "start_early" || selectedOptions["start_now"] === "start_now") {
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
            }
            if (selectedOptions["reschedule"] === "reschedule") {
                updatedTask.startDate = currentDateTime;
                updatedTask.startTime = null;
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
            }
            break;

        case "todo-done":
            if (selectedOptions["auto_record"] === "auto_record") {
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
                updatedTask.actualEndDate = currentDateTime;
                updatedTask.actualEndTime = currentDateTime;
            }
            // Manual times will be set from form data
            break;

        case "todo-overdue":
            if (selectedOptions["set_past_due"] === "set_past_due" || selectedOptions["force_past_due"] === "force_past_due") {
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            }
            break;

        // === BACKLOG TRANSITIONS ===
        case "backlog-todo":
            if (selectedOptions["switch_to_progress"] === "switch_to_progress") {
                // Redirect to in-progress transition
                return executeStatusTransition(task, oldStatus, "in-progress", { record_start: "record_start" }, isCreateMode);
            }
            if (!updatedTask.startDate || selectedOptions["set_start"] === "set_start" || selectedOptions["update_start"] === "update_start") {
                const futureDate = new Date(now.getTime() + 60 * 60 * 1000);
                updatedTask.startDate = futureDate;
                updatedTask.startTime = null;
            }
            break;

        case "backlog-in-progress":
            if (selectedOptions["record_start"] === "record_start") {
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
                // Auto-set planned start if missing
                if (!updatedTask.startDate) {
                    updatedTask.startDate = currentDateTime;
                    updatedTask.startTime = null;
                }
            }
            if (selectedOptions["set_planned"] === "set_planned") {
                updatedTask.startDate = currentDateTime;
                updatedTask.startTime = null;
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
            }
            break;

        case "backlog-done":
            if (selectedOptions["auto_record"] === "auto_record") {
                updatedTask.startDate = currentDateTime;
                updatedTask.startTime = null;
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
                updatedTask.actualEndDate = currentDateTime;
                updatedTask.actualEndTime = currentDateTime;
            }
            // Manual times will be set from form data
            break;

        case "backlog-overdue":
            if (selectedOptions["set_past_due"] === "set_past_due" || selectedOptions["force_past_due"] === "force_past_due") {
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
                // Ensure start date exists and is before due date
                if (!updatedTask.startDate) {
                    const startDate = new Date(pastDate.getTime() - 60 * 60 * 1000);
                    updatedTask.startDate = startDate;
                    updatedTask.startTime = null;
                }
            }
            break;
    }

    // Add activity log entry
    if (!isCreateMode) {
        const activityEntry = {
            id: `${currentDateTime.getTime()}-${Math.random()
                .toString(36)
                .substring(2, 8)}`,
            details: `Status changed from "${oldStatus}" to "${newStatus}"`,
            action: "status_changed" as const,
            userId: "user",
            timestamp: currentDateTime,
        };
        updatedTask.activityLog = [
            ...(updatedTask.activityLog || []),
            activityEntry,
        ];
    }

    return updatedTask as Task;
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
export const requiresUserInput = (from: Status, to: Status, task: Task): boolean => {
    const scenarios = getTransitionScenarios(from, to, task);
    return scenarios.some(scenario =>
        scenario.options.some(option =>
            option.value === "manual_start" ||
            option.value === "manual_times" ||
            option.value === "set_start" ||
            option.value === "set_past_due"
        )
    );
};

// Helper function to get suggested alternative transitions
export const getSuggestedAlternatives = (from: Status, to: Status, task: Task): Status[] => {
    const scenarios = getTransitionScenarios(from, to, task);
    const suggestions: Status[] = [];

    scenarios.forEach(scenario => {
        scenario.options.forEach(option => {
            if (option.value === "suggest_backlog") {
                suggestions.push("backlog");
            } else if (option.value === "switch_to_progress") {
                suggestions.push("in-progress");
            }
        });
    });

    return suggestions;
};