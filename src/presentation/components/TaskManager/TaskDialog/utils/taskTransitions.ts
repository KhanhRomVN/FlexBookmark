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

    const hasIncompleteRequiredSubtasks = (task: Task): boolean => {
        if (!task.subtasks) return false;
        return task.subtasks.some(
            (subtask) => subtask.requiredCompleted && !subtask.completed
        );
    };

    const startDate = task.startDate ? new Date(task.startDate) : null;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    if (to === "done" && hasIncompleteRequiredSubtasks(task)) {
        scenarios.push({
            title: "Incomplete Required Subtasks",
            options: [
                {
                    label: "Some required subtasks are not completed",
                    value: "invalid",
                    description: "Complete all required subtasks before marking as done"
                },
                { label: "Cancel", value: "cancel" },
            ],
        });
        return scenarios;
    }

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

    // NEW: Check for missing required fields when transitioning to in-progress
    if (to === "in-progress") {
        const hasRequiredFields = task.startTime && task.startDate && task.actualStartTime && task.actualStartDate;

        if (!hasRequiredFields) {
            scenarios.push({
                title: "Missing Required Fields",
                options: [
                    {
                        label: "Use planned start as actual start time",
                        value: "use_planned_as_actual",
                        description: "Set actualStartTime/Date to match startTime/Date"
                    },
                    {
                        label: "Set actual start time to now",
                        value: "set_actual_to_now",
                        description: "Record current time as actual start time"
                    },
                    {
                        label: "Cancel transition",
                        value: "cancel"
                    }
                ]
            });
            return scenarios; // Return early to prevent other scenarios
        }
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
        // In taskTransitions.ts - Enhanced done transitions with Google Tasks awareness
        case "done-backlog":
            scenarios.push({
                title: "⚠️ Google Tasks Limitation Notice",
                options: [
                    {
                        label: "I understand this will create a new task",
                        value: "google_tasks_warning",
                        description: "Google Tasks API doesn't allow direct restoration. Original completed task will remain."
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            scenarios.push({
                title: "Reset Task Data",
                options: [
                    {
                        label: "Reset all time fields",
                        value: "reset",
                        description: "Clear all scheduling and actual times for the new task"
                    },
                    {
                        label: "Keep original timestamps",
                        value: "keep_times",
                        description: "Preserve original time data in the new task"
                    },
                ],
            });
            break;

        case "done-todo":
            scenarios.push({
                title: "⚠️ Google Tasks Limitation Notice",
                options: [
                    {
                        label: "I understand this will create a new task",
                        value: "google_tasks_warning",
                        description: "Google Tasks API doesn't allow direct restoration. Original completed task will remain."
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            scenarios.push({
                title: "Schedule New Task",
                options: [
                    {
                        label: "Set future start time",
                        value: "set_future_start",
                        description: "Schedule the new task to start in the future"
                    },
                    {
                        label: "Start immediately",
                        value: "start_now",
                        description: "Set the new task to start right away"
                    },
                ],
            });
            break;

        case "done-in-progress":
            scenarios.push({
                title: "⚠️ Google Tasks Limitation Notice",
                options: [
                    {
                        label: "I understand this will create a new task",
                        value: "google_tasks_warning",
                        description: "Google Tasks API doesn't allow direct restoration. Original completed task will remain."
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            scenarios.push({
                title: "Work Resumption",
                options: [
                    {
                        label: "Start fresh with current time",
                        value: "fresh_start",
                        description: "Begin working on the new task immediately"
                    },
                    {
                        label: "Keep original start time reference",
                        value: "keep_original_start",
                        description: "Preserve reference to when work originally started"
                    },
                ],
            });
            break;

        case "done-overdue":
            scenarios.push({
                title: "⚠️ Google Tasks Limitation Notice",
                options: [
                    {
                        label: "I understand this will create a new task",
                        value: "google_tasks_warning",
                        description: "Google Tasks API doesn't allow direct restoration. Original completed task will remain."
                    },
                    { label: "Cancel", value: "cancel" },
                ],
            });
            scenarios.push({
                title: "Overdue Task Setup",
                options: [
                    {
                        label: "Set past due date to make overdue",
                        value: "set_past_due",
                        description: "Configure the new task as overdue with past due date"
                    },
                    {
                        label: "Keep existing due date if past",
                        value: "keep_due_if_past",
                        description: "Maintain original due date if it's already past"
                    },
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
                            label: "Adjust date & time",
                            value: "adjust_time",
                            description: "Open calendar to set specific dates"
                        },
                        {
                            label: "Auto-schedule (tomorrow 9 AM)",
                            value: "auto_schedule",
                            description: "Set start time to tomorrow morning"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            } else if (!isFutureDate(startDate)) {
                scenarios.push({
                    title: "Invalid Start Time",
                    options: [
                        {
                            label: "Adjust to future date",
                            value: "adjust_time",
                            description: "Set start time to future date"
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
                        {
                            label: `Confirm (${formatDisplayDate(startDate)})`,
                            value: "confirm"
                        },
                        {
                            label: "Adjust schedule",
                            value: "adjust_time",
                            description: "Change date and time"
                        },
                        { label: "Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        case "backlog-in-progress":
            scenarios.push({
                title: "Start Task",
                options: [
                    {
                        label: "Set specific schedule",
                        value: "adjust_time",
                        description: "Choose exact start and due dates"
                    },
                    {
                        label: "Start now (auto-record)",
                        value: "start_now",
                        description: "Set all times to current time"
                    },
                    {
                        label: "Start now + set due date",
                        value: "start_now_with_due",
                        description: "Start now and set a due date later"
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

    // Handle missing actual start time/date when transitioning to in-progress
    if (newStatus === "in-progress") {
        if (selectedOptions["use_planned_as_actual"] === "use_planned_as_actual") {
            updatedTask.actualStartTime = updatedTask.startTime;
            updatedTask.actualStartDate = updatedTask.startDate;
        } else if (selectedOptions["set_actual_to_now"] === "set_actual_to_now") {
            updatedTask.actualStartTime = currentDateTime;
            updatedTask.actualStartDate = currentDateTime;
        } else if (!updatedTask.actualStartTime || !updatedTask.actualStartDate) {
            updatedTask.actualStartTime = updatedTask.startTime || currentDateTime;
            updatedTask.actualStartDate = updatedTask.startDate || currentDateTime;
        }
    }

    // Handle transition OUT of old status
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
        // OVERDUE transitions
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
                if (selectedOptions["manual_start"] !== "manual_start") {
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

        // DONE transitions
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
            if (!updatedTask.startDate || new Date(updatedTask.startDate) > now) {
                updatedTask.startDate = currentDateTime;
                updatedTask.startTime = null;
            }
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
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            }
            break;

        // IN-PROGRESS transitions
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
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            }
            break;

        // TODO transitions
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
            break;
        case "todo-overdue":
            if (selectedOptions["set_past_due"] === "set_past_due" || selectedOptions["force_past_due"] === "force_past_due") {
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
            }
            break;

        // BACKLOG transitions
        case "backlog-todo":
            if (selectedOptions["switch_to_progress"] === "switch_to_progress") {
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
            break;
        case "backlog-overdue":
            if (selectedOptions["set_past_due"] === "set_past_due" || selectedOptions["force_past_due"] === "force_past_due") {
                const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
                updatedTask.dueDate = pastDate;
                updatedTask.dueTime = null;
                if (!updatedTask.startDate) {
                    const startDate = new Date(pastDate.getTime() - 60 * 60 * 1000);
                    updatedTask.startDate = startDate;
                    updatedTask.startTime = null;
                }
            }
            break;
    }

    // Add activity log entry (without saving)
    if (!isCreateMode) {
        const activityEntry = {
            id: `${currentDateTime.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
            details: `Status changed from "${oldStatus}" to "${newStatus}"`,
            action: "status_changed" as const,
            userId: "user",
            timestamp: currentDateTime,
        };
        updatedTask.activityLog = [...(updatedTask.activityLog || []), activityEntry];
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

export const getSuggestedStatusFromDates = (task: Task): Status | null => {
    const now = new Date();
    const startDate = task.startDate ? new Date(task.startDate) : null;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    // Allow transitions from done/overdue if dates are updated
    if (dueDate && dueDate > now && (task.status === "done" || task.status === "overdue")) {
        if (startDate && startDate <= now) {
            return "in-progress";
        }
        return "todo";
    }

    // Don't suggest changes for completed tasks unless they're being restored
    if (task.status === 'done') return null;

    // Check for overdue first (highest priority)
    if (dueDate && dueDate < now && task.status !== 'overdue') {
        return 'overdue';
    }

    // If task has start date/time
    if (startDate) {
        // Task should be in-progress if start time has passed and not done/overdue
        if (startDate <= now && (task.status === 'todo' || task.status === 'backlog')) {
            return 'in-progress';
        }

        // Task should be todo if start time is in future and currently in backlog or in-progress
        if (startDate > now && (task.status === 'backlog' || task.status === 'in-progress')) {
            return 'todo';
        }
    }

    // If task is in backlog but has scheduling info, suggest todo
    if (task.status === 'backlog' && (startDate || dueDate)) {
        return 'todo';
    }

    // If task has no dates but is in todo/in-progress, suggest backlog
    if (!startDate && !dueDate && (task.status === 'todo' || task.status === 'in-progress')) {
        return 'backlog';
    }

    return null;
};