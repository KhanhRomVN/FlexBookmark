import { useState, useEffect } from "react";
import { Task, Status } from "../../../../types/task";
import { getSuggestedStatusFromDates } from "../utils/taskTransitions";

export const useTaskState = (task: Task | null, isCreateMode: boolean) => {
    const [editedTask, setEditedTask] = useState<Task | null>(task);
    const [suggestedStatus, setSuggestedStatus] = useState<Status | null>(null);

    useEffect(() => {
        setEditedTask(task);
    }, [task]);

    // Auto-suggest status when dates change
    useEffect(() => {
        if (editedTask && !isCreateMode) {
            const suggested = getSuggestedStatusFromDates(editedTask);
            setSuggestedStatus(suggested);
        }
    }, [editedTask?.startDate, editedTask?.startTime, editedTask?.dueDate, editedTask?.dueTime, editedTask?.status, isCreateMode]);

    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, [field]: value };

            // Auto-update status for create mode based on dates
            if (isCreateMode && (field === 'startDate' || field === 'startTime' || field === 'dueDate' || field === 'dueTime')) {
                const suggested = getSuggestedStatusFromDates(updated);
                if (suggested && suggested !== updated.status) {
                    updated.status = suggested;
                }
            }

            return updated;
        });
    };

    // Get the effective current status (actual status or suggested status)
    const getEffectiveStatus = (): Status => {
        if (!editedTask) return 'backlog';
        if (isCreateMode) return editedTask.status;
        return suggestedStatus && suggestedStatus !== editedTask.status ? suggestedStatus : editedTask.status;
    };

    return {
        editedTask,
        setEditedTask,
        handleChange,
        suggestedStatus,
        getEffectiveStatus
    };
};