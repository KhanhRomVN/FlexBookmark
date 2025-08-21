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
    isCreateMode: boolean,
    getEffectiveStatus?: () => Status // Add this parameter
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

        // Use effective status for transition logic
        const currentStatus = getEffectiveStatus ? getEffectiveStatus() : editedTask.status;

        const scenarios = getTransitionScenarios(
            currentStatus, // Use effective status instead of editedTask.status
            newStatus,
            editedTask
        );

        // If transitioning to "done" but there are incomplete required subtasks
        if (newStatus === "done" && hasIncompleteRequiredSubtasks(editedTask)) {
            setPendingTransition({
                from: currentStatus,
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

        // If there are scenarios requiring user choice
        if (scenarios.length > 0) {
            setPendingTransition({
                from: currentStatus,
                to: newStatus,
                scenarios,
            });
            setShowTransitionDialog(true);
            return;
        }

        // Direct transition if no special handling needed
        executeStatusTransition(currentStatus, newStatus, {});
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
                // TODO: handle error if needed
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