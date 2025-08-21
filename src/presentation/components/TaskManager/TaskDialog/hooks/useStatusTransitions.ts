// src/presentation/components/TaskManager/TaskDialog/hooks/useStatusTransitions.ts
import { useCallback, useState } from "react";
import { Status, Task } from "../../../../types/task";
import {
    getTransitionScenarios,
    executeStatusTransition as runStatusTransition,
} from "../utils/taskTransitions";

export const useStatusTransitions = (
    editedTask: Task | null,
    setEditedTask: (task: Task) => void,
    onSave: (task: Task) => void,
    isCreateMode: boolean
) => {
    const [pendingTransition, setPendingTransition] = useState<{
        from: Status;
        to: Status;
        scenarios: any[];
    } | null>(null);

    const [showTransitionDialog, setShowTransitionDialog] = useState(false);

    const hasIncompleteRequiredSubtasks = (task: Task | null): boolean => {
        if (!task?.subtasks) return false;
        return task.subtasks.some(
            (subtask) => subtask.requiredCompleted && !subtask.completed
        );
    };

    const handleStatusChange = (newStatus: Status) => {
        if (!editedTask) return;

        const scenarios = getTransitionScenarios(
            editedTask.status,
            newStatus,
            editedTask
        );

        // Nếu chuyển sang "done" nhưng còn subtasks bắt buộc chưa xong
        if (newStatus === "done" && hasIncompleteRequiredSubtasks(editedTask)) {
            setPendingTransition({
                from: editedTask.status,
                to: newStatus,
                scenarios: [
                    {
                        title: "Incomplete Required Subtasks",
                        options: [
                            {
                                label: "Complete the task anyway",
                                value: "force_complete",
                                description:
                                    "Mark the task as done even though some required subtasks are incomplete",
                            },
                            {
                                label: "Cancel",
                                value: "cancel",
                            },
                        ],
                    },
                ],
            });
            setShowTransitionDialog(true);
            return;
        }

        // Nếu có scenario yêu cầu lựa chọn
        if (scenarios.length > 0) {
            setPendingTransition({
                from: editedTask.status,
                to: newStatus,
                scenarios,
            });
            setShowTransitionDialog(true);
            return;
        }

        // Nếu không có gì đặc biệt -> chuyển trực tiếp
        executeStatusTransition(editedTask.status, newStatus, {});
    };

    const executeStatusTransition = useCallback(
        (
            from: Status,
            to: Status,
            selectedOptions: Record<string, string>,
            shouldSave: boolean = false
        ) => {
            if (!editedTask) return;

            const updatedTask = runStatusTransition(
                editedTask,
                from,
                to,
                selectedOptions,
                isCreateMode
            );

            if ("error" in updatedTask) {
                // TODO: xử lý error nếu cần
                return;
            }

            setEditedTask(updatedTask);

            if (shouldSave) {
                onSave(updatedTask);
            }
        },
        [editedTask, isCreateMode, onSave, setEditedTask]
    );

    return {
        pendingTransition,
        showTransitionDialog,
        setShowTransitionDialog,
        setPendingTransition,
        handleStatusChange,
        executeStatusTransition,
    };
};
