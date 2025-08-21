// src/presentation/components/TaskManager/TaskDialog/hooks/useStatusTransitions.ts
import { useState } from "react";
import { Status, Task } from "../../../../types/task";
import { getTransitionScenarios, executeStatusTransition as executeTransition } from "../utils/taskTransitions";

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

        if (scenarios.length > 0) {
            setPendingTransition({
                from: editedTask.status,
                to: newStatus,
                scenarios,
            });
            setShowTransitionDialog(true);
            return;
        }

        executeStatusTransition(editedTask.status, newStatus, {});
    };

    const executeStatusTransition = (
        oldStatus: Status,
        newStatus: Status,
        selectedOptions: Record<string, string>
    ) => {
        if (!editedTask) return;

        if (selectedOptions["Incomplete Required Subtasks"] === "force_complete") {
            const updatedTask = { ...editedTask, status: newStatus };
            setEditedTask(updatedTask);
            onSave(updatedTask);
            return;
        }

        if (selectedOptions["Incomplete Required Subtasks"] === "cancel") {
            return;
        }

        const updatedTask = executeTransition(
            editedTask,
            oldStatus,
            newStatus,
            selectedOptions,
            isCreateMode
        );

        setEditedTask(updatedTask);
        onSave(updatedTask);
    };

    return {
        pendingTransition,
        showTransitionDialog,
        setShowTransitionDialog,
        setPendingTransition,
        handleStatusChange,
        executeStatusTransition,
    };
};