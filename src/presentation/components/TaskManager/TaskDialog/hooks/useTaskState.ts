import { useState, useEffect } from "react";
import { Task, Status } from "../../../../types/task";
import { getSuggestedStatusFromDates } from "../utils/taskTransitions";

export const useTaskState = (task: Task | null, isCreateMode: boolean) => {
    const [editedTask, setEditedTask] = useState<Task | null>(task);
    const [suggestedStatus, setSuggestedStatus] = useState<Status | null>(null);

    useEffect(() => {
        setEditedTask(task);
    }, [task]);

    // Auto-suggest and auto-apply status when dates change
    useEffect(() => {
        if (editedTask && !isCreateMode) {
            console.log("Auto-suggest status check triggered");
            const suggested = getSuggestedStatusFromDates(editedTask);
            console.log("Suggested status:", suggested);
            setSuggestedStatus(suggested);

            // Auto-apply the suggested status immediately
            if (suggested && suggested !== editedTask.status) {
                console.log("Auto-applying suggested status:", suggested);
                setEditedTask(prev => {
                    if (!prev) return prev;

                    let updatedTask = { ...prev, status: suggested };

                    // If transitioning to in-progress, ensure actual start times are set
                    if (suggested === "in-progress" && (!prev.actualStartTime || !prev.actualStartDate)) {
                        // Use the planned start times if available, otherwise use current time
                        const now = new Date();
                        updatedTask.actualStartTime = prev.startTime || now;
                        updatedTask.actualStartDate = prev.startDate || now;
                    }

                    return updatedTask;
                });
            }
        }
    }, [editedTask?.startDate, editedTask?.startTime, editedTask?.dueDate, editedTask?.dueTime, editedTask?.status, isCreateMode]);

    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask((prev) => {
            if (!prev) return prev;
            let updated = { ...prev, [field]: value };

            // Auto-update status for create mode based on dates
            if (isCreateMode && (field === 'startDate' || field === 'startTime' || field === 'dueDate' || field === 'dueTime')) {
                const suggested = getSuggestedStatusFromDates(updated);
                if (suggested && suggested !== updated.status) {
                    updated.status = suggested;

                    // If transitioning to in-progress during create mode, set actual start times
                    if (suggested === "in-progress" && (!updated.actualStartTime || !updated.actualStartDate)) {
                        const now = new Date();
                        updated.actualStartTime = updated.startTime || now;
                        updated.actualStartDate = updated.startDate || now;
                    }
                }
            }

            return updated;
        });
    };

    // Get the effective current status (actual status or suggested status)
    const getEffectiveStatus = (): Status => {
        if (!editedTask) return 'backlog';
        if (isCreateMode) return editedTask.status;

        console.log("Calculating effective status:", {
            currentStatus: editedTask.status,
            suggestedStatus,
            isDone: editedTask.status === 'done',
            isOverdue: editedTask.status === 'overdue'
        });

        // If user has explicitly set status through validation, use that
        if (editedTask.status === 'done' || editedTask.status === 'overdue') {
            console.log("Using explicit status:", editedTask.status);
            return editedTask.status;
        }

        const effectiveStatus = suggestedStatus && suggestedStatus !== editedTask.status ? suggestedStatus : editedTask.status;
        console.log("Using effective status:", effectiveStatus);
        return effectiveStatus;
    };

    return {
        editedTask,
        setEditedTask,
        handleChange,
        suggestedStatus: null, // Always return null to hide the suggestion UI
        getEffectiveStatus
    };
};  