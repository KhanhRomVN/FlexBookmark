import { Task, Status } from "../../../../../types/task";

export const getTransitionScenarios = (from: Status, to: Status, task: Task) => {
    const now = new Date();
    const scenarios = [];

    // Helper functions
    const hasOverdueCondition = task.endDate && new Date(task.endDate) < now;
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const hasIncompleteSubtasks =
        hasSubtasks && task.subtasks!.some((st) => !st.completed);

    switch (`${from}-${to}`) {
        case "backlog-todo":
            if (hasOverdueCondition) {
                scenarios.push({
                    title: "⚠️ Past Due Task",
                    options: [
                        { label: "📋 Move to Todo anyway", value: "proceed" },
                        { label: "⏰ Move to Overdue instead", value: "overdue" },
                        { label: "📅 Update due date first", value: "update_date" },
                        { label: "❌ Cancel", value: "cancel" },
                    ],
                });
            }
            break;

        case "backlog-in-progress":
        case "todo-in-progress":
            // Early start warning
            if (task.startDate && new Date(task.startDate) > now) {
                scenarios.push({
                    title: "⏰ Early Start Warning",
                    options: [
                        { label: "🚀 Start early (recommended)", value: "start_early" },
                        { label: "📅 Update planned start date", value: "update_start" },
                        {
                            label: "⏳ Schedule reminder for planned date",
                            value: "schedule_reminder",
                        },
                        { label: "❌ Cancel", value: "cancel" },
                    ],
                });
            }

            // Overdue condition
            if (hasOverdueCondition) {
                scenarios.push({
                    title: "🚨 Working on Overdue Task",
                    options: [
                        {
                            label: "🔥 Start anyway (mark as overdue)",
                            value: "start_overdue",
                        },
                        { label: "📅 Update due date first", value: "update_date" },
                        { label: "⚡ Mark as ASAP priority", value: "mark_asap" },
                        { label: "❌ Cancel", value: "cancel" },
                    ],
                });
            }

            // Capacity check for todo->in-progress
            if (from === "todo") {
                scenarios.push({
                    title: "⚖️ Capacity Management",
                    options: [
                        { label: "🚀 Start now (within capacity)", value: "start_now" },
                        { label: "⏸️ Pause other tasks first", value: "pause_others" },
                        { label: "📅 Schedule for later", value: "schedule_later" },
                        { label: "🔄 Delegate this task", value: "delegate" },
                    ],
                });
            }
            break;

        case "backlog-done":
        case "todo-done":
            scenarios.push({
                title: "🤔 Skip In Progress Phase?",
                options: [
                    {
                        label: "⚡ Complete immediately (simple task)",
                        value: "complete_immediate",
                    },
                    {
                        label: "📝 Add work notes before completion",
                        value: "add_notes",
                    },
                    { label: "⏱️ Track time spent", value: "track_time" },
                    { label: "🔄 Start In Progress instead", value: "to_in_progress" },
                    { label: "❌ Cancel", value: "cancel" },
                ],
            });

            if (hasIncompleteSubtasks) {
                scenarios.push({
                    title: "📋 Incomplete Subtasks Warning",
                    options: [
                        {
                            label: "✅ Mark all subtasks complete",
                            value: "complete_all_subtasks",
                        },
                        {
                            label: "🗑️ Remove incomplete subtasks",
                            value: "remove_incomplete",
                        },
                        {
                            label: "📝 Convert subtasks to separate tasks",
                            value: "convert_subtasks",
                        },
                        {
                            label: "❌ Cannot complete with pending subtasks",
                            value: "cancel",
                        },
                    ],
                });
            }
            break;

        case "in-progress-backlog":
        case "in-progress-todo":
            scenarios.push({
                title: "💼 Stop Work Confirmation",
                options: [
                    {
                        label: "⏸️ Pause work (keep progress notes)",
                        value: "pause_keep_progress",
                    },
                    { label: "🗑️ Stop and lose progress", value: "stop_lose_progress" },
                    { label: "📝 Add stopping reason", value: "add_reason" },
                    { label: "⏱️ Track time already spent", value: "track_time" },
                    { label: "❌ Keep working", value: "cancel" },
                ],
            });
            break;

        case "in-progress-done":
            // Early completion check
            if (task.endDate && new Date(task.endDate) > now) {
                scenarios.push({
                    title: "🏆 Early Completion",
                    options: [
                        { label: "✅ Mark complete early", value: "complete_early" },
                        { label: "📊 Log efficiency metrics", value: "log_metrics" },
                        { label: "🔄 Use extra time for enhancement", value: "enhance" },
                        { label: "🎯 Move up next priority task", value: "next_task" },
                    ],
                });
            }

            scenarios.push({
                title: "🎯 Completion Quality",
                options: [
                    {
                        label: "✅ Fully complete - ready for review",
                        value: "fully_complete",
                    },
                    {
                        label: "📝 Complete with notes/caveats",
                        value: "complete_with_notes",
                    },
                    {
                        label: "⚡ MVP complete - can enhance later",
                        value: "mvp_complete",
                    },
                    {
                        label: "🔄 Complete but needs follow-up task",
                        value: "needs_followup",
                    },
                ],
            });
            break;

        case "in-progress-overdue":
            scenarios.push({
                title: "🚨 Overdue While Working",
                options: [
                    {
                        label: "⏰ Mark overdue (stop work)",
                        value: "mark_overdue_stop",
                    },
                    {
                        label: "🏃 Continue working (extend deadline)",
                        value: "continue_extend",
                    },
                    { label: "⚡ Push to complete ASAP", value: "complete_asap" },
                    { label: "📞 Escalate to manager/stakeholder", value: "escalate" },
                    { label: "📅 Negotiate new deadline", value: "negotiate_deadline" },
                    { label: "🔄 Partial delivery option", value: "partial_delivery" },
                ],
            });
            break;

        case "done-backlog":
        case "done-todo":
        case "done-in-progress":
            scenarios.push({
                title: "🚨 Reopen Completed Task",
                options: [
                    {
                        label: "🔄 Reopen (keep actualStartDate)",
                        value: "reopen_keep_dates",
                    },
                    {
                        label: "🗑️ Full reset (clear all actual times)",
                        value: "full_reset",
                    },
                    {
                        label: "📝 Create follow-up task instead",
                        value: "create_followup",
                    },
                    { label: "🔍 Add reopening reason", value: "add_reason" },
                    { label: "❌ Cancel - keep completed", value: "cancel" },
                ],
            });

            // Recent completion check
            if (
                task.actualEndDate &&
                now.getTime() - new Date(task.actualEndDate).getTime() <
                24 * 60 * 60 * 1000
            ) {
                scenarios.push({
                    title: "⚡ Recent Completion",
                    options: [
                        { label: "🔧 Quick fix needed", value: "quick_fix" },
                        { label: "📋 Missed requirement", value: "missed_requirement" },
                        { label: "🧪 Failed testing/review", value: "failed_testing" },
                    ],
                });
            }
            break;

        case "overdue-in-progress":
            scenarios.push({
                title: "⏰ Late Start Strategy",
                options: [
                    { label: "🔥 Full scope (original plan)", value: "full_scope" },
                    { label: "⚡ MVP scope (reduced deliverable)", value: "mvp_scope" },
                    {
                        label: "📞 Stakeholder consultation first",
                        value: "consult_stakeholders",
                    },
                    { label: "🏃 Crash mode (extra resources)", value: "crash_mode" },
                    { label: "📋 Partial delivery option", value: "partial_delivery" },
                ],
            });

            // Significantly overdue check
            if (
                task.endDate &&
                now.getTime() - new Date(task.endDate).getTime() >
                7 * 24 * 60 * 60 * 1000
            ) {
                scenarios.push({
                    title: "📞 Stakeholder Communication",
                    options: [
                        {
                            label: "📧 Notify stakeholders before starting",
                            value: "notify_before",
                        },
                        {
                            label: "📅 Provide new estimated completion",
                            value: "new_estimate",
                        },
                        {
                            label: "🔄 Request scope clarification",
                            value: "clarify_scope",
                        },
                    ],
                });
            }
            break;

        case "overdue-done":
            scenarios.push({
                title: "📋 Late Completion Process",
                options: [
                    {
                        label: "✅ Complete as-is (late delivery)",
                        value: "complete_late",
                    },
                    {
                        label: "📝 Complete with delivery notes",
                        value: "complete_with_notes",
                    },
                    {
                        label: "📊 Log delay reasons for analysis",
                        value: "log_delay_reasons",
                    },
                    {
                        label: "🔄 Create follow-up tasks for improvements",
                        value: "create_improvements",
                    },
                    {
                        label: "📞 Notify stakeholders of completion",
                        value: "notify_completion",
                    },
                ],
            });

            scenarios.push({
                title: "🎯 Quality Assurance",
                options: [
                    {
                        label: "✅ Full quality - ready for delivery",
                        value: "full_quality",
                    },
                    {
                        label: "⚡ MVP quality - functional but basic",
                        value: "mvp_quality",
                    },
                    {
                        label: "🔄 Needs quality review before delivery",
                        value: "needs_review",
                    },
                    {
                        label: "📋 Create quality improvement backlog",
                        value: "quality_backlog",
                    },
                ],
            });
            break;
    }

    return scenarios;
};

export const executeStatusTransition = (
    task: Task,
    oldStatus: Status,
    newStatus: Status,
    selectedOptions: Record<string, string>,
    isCreateMode: boolean
): Task => {
    const currentDateTime = new Date();
    let updatedTask = { ...task, status: newStatus };

    // Xử lý các lựa chọn của user
    Object.entries(selectedOptions).forEach(([scenario, option]) => {
        switch (option) {
            case "cancel":
                return; // Không thực hiện chuyển đổi

            case "overdue":
                updatedTask.status = "overdue";
                break;

            case "update_date":
                // Logic cập nhật ngày - có thể mở date picker
                break;

            case "start_early":
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
                break;

            case "complete_all_subtasks":
                if (updatedTask.subtasks) {
                    updatedTask.subtasks = updatedTask.subtasks.map((st) => ({
                        ...st,
                        completed: true,
                    }));
                }
                break;

            case "full_reset":
                updatedTask.actualStartDate = null;
                updatedTask.actualStartTime = null;
                updatedTask.actualEndDate = null;
                updatedTask.actualEndTime = null;
                break;

            // Thêm các case khác theo needs
        }
    });

    // Handle transition OUT of old status
    switch (oldStatus) {
        case "in-progress":
            if (newStatus !== "done") {
                updatedTask.actualStartDate = null;
                updatedTask.actualStartTime = null;
            }
            break;
        case "done":
            updatedTask.actualEndDate = null;
            updatedTask.actualEndTime = null;
            break;
    }

    // Handle transition INTO new status
    switch (newStatus) {
        case "in-progress":
            updatedTask.actualStartDate = currentDateTime;
            updatedTask.actualStartTime = currentDateTime;
            break;
        case "done":
            updatedTask.actualEndDate = currentDateTime;
            updatedTask.actualEndTime = currentDateTime;
            if (!updatedTask.actualStartDate) {
                updatedTask.actualStartDate = currentDateTime;
                updatedTask.actualStartTime = currentDateTime;
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
            action: "status_changed",
            userId: "user",
            timestamp: currentDateTime,
        };
        updatedTask.activityLog = [
            ...(updatedTask.activityLog || []),
            activityEntry,
        ];
    }

    return updatedTask;
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