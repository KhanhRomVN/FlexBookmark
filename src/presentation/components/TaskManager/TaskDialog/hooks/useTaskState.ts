// src/presentation/components/TaskManager/TaskDialog/hooks/useTaskState.ts

import { useState, useEffect } from "react";
import { Task, Status } from "../../../../types/task";
import { getSuggestedStatusFromDates } from "../utils/taskTransitions";

export const useTaskState = (task: Task | null, isCreateMode: boolean) => {
    const [editedTask, setEditedTask] = useState<Task | null>(task);
    const [suggestedStatus, setSuggestedStatus] = useState<Status | null>(null);
    const [isStatusManuallyChanged, setIsStatusManuallyChanged] = useState(false);

    // Reset state khi task thay đổi
    useEffect(() => {
        setEditedTask(task);
        setIsStatusManuallyChanged(false);
    }, [task]);

    // Auto-suggest và auto-apply status khi dates thay đổi
    useEffect(() => {
        if (editedTask && !isCreateMode && !isStatusManuallyChanged) {
            const suggested = getSuggestedStatusFromDates(editedTask);
            setSuggestedStatus(suggested);

            if (suggested && suggested !== editedTask.status) {
                setEditedTask(prev => {
                    if (!prev) return prev;

                    let updatedTask = { ...prev, status: suggested };

                    if (suggested === "in-progress" && (!prev.actualStartTime || !prev.actualStartDate)) {
                        const now = new Date();
                        updatedTask.actualStartTime = prev.startTime || now;
                        updatedTask.actualStartDate = prev.startDate || now;
                    }

                    return updatedTask;
                });
            }
        }
    }, [
        editedTask?.startDate,
        editedTask?.startTime,
        editedTask?.dueDate,
        editedTask?.dueTime,
        isCreateMode,
        isStatusManuallyChanged
    ]);

    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask((prev) => {
            if (!prev) return prev;

            // Chỉ set manual flag khi user trực tiếp thay đổi status qua UI
            // KHÔNG set khi thay đổi thông qua validation dialog
            if (field === "status") {
                setIsStatusManuallyChanged(true);
            }

            let updated = { ...prev, [field]: value };

            // Trong create mode, auto-update status dựa theo ngày/giờ
            if (
                isCreateMode &&
                (field === "startDate" || field === "startTime" || field === "dueDate" || field === "dueTime")
            ) {
                const suggested = getSuggestedStatusFromDates(updated);
                if (suggested && suggested !== updated.status) {
                    updated.status = suggested;

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

    // NEW: Method để handle system-triggered status changes (từ validation dialog)
    const handleSystemStatusChange = (newStatus: Status, additionalFields?: Partial<Task>) => {
        setEditedTask(prev => {
            if (!prev) return prev;

            let updatedTask = { ...prev, status: newStatus, ...additionalFields };

            // Set actual times nếu cần
            if (newStatus === "done" && !prev.actualEndDate) {
                const now = new Date();
                updatedTask.actualEndDate = now;
                updatedTask.actualEndTime = now;
            }

            if (newStatus === "in-progress" && (!prev.actualStartTime || !prev.actualStartDate)) {
                const now = new Date();
                updatedTask.actualStartTime = prev.startTime || now;
                updatedTask.actualStartDate = prev.startDate || now;
            }

            return updatedTask;
        });

        // CRITICAL: Reset manual flag để cho phép auto-suggestion hoạt động trở lại
        // khi dates thay đổi trong tương lai
        setIsStatusManuallyChanged(false);

    };

    const getEffectiveStatus = (): Status => {
        if (!editedTask) return "backlog";
        if (isCreateMode) return editedTask.status;

        if (editedTask.status === "done" || editedTask.status === "overdue") {
            return editedTask.status;
        }

        const effectiveStatus =
            suggestedStatus && suggestedStatus !== editedTask.status ? suggestedStatus : editedTask.status;

        return effectiveStatus;
    };

    return {
        editedTask,
        setEditedTask,
        handleChange,
        handleSystemStatusChange, // NEW: Export method này
        suggestedStatus: null, // luôn trả null để ẩn UI suggestion
        getEffectiveStatus
    };
};