// src/presentation/components/TaskManager/TaskDialog/hooks/useGoogleTasksIntegration.ts
import { useState } from "react";
import { Status, Task } from "../../../../../types/task";
import { GoogleTasksStatusHandler } from "../utils/GGTaskStatusHandler";

export const useGoogleTasksIntegration = (
    editedTask: Task | null,
    onClose: () => void,
    getFreshToken?: () => Promise<string>,
    createGoogleTask?: (token: string, taskData: Task, activeGroup: string) => Promise<any>,
    deleteGoogleTask?: (token: string, taskId: string, activeGroup: string) => Promise<any>,
    activeGroup?: string,
    lists?: any[],
    setLists?: React.Dispatch<React.SetStateAction<any[]>>,
    setError?: (error: string) => void,
    startTransition?: (callback: () => void) => void,
    setSelectedTask?: (task: Task | null) => void,
    setIsDialogOpen?: (isOpen: boolean) => void
) => {
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [pendingRestoreStatus, setPendingRestoreStatus] = useState<Status | null>(null);

    const handleRestoreConfirm = async () => {
        if (!editedTask || !pendingRestoreStatus) return;

        try {
            if (!getFreshToken || !createGoogleTask || !deleteGoogleTask || !activeGroup) {
                throw new Error("Google Tasks integration not properly configured");
            }

            const result = await GoogleTasksStatusHandler.createTaskFromCompleted(
                editedTask,
                pendingRestoreStatus,
                async (taskData) => {
                    const token = await getFreshToken();
                    return await createGoogleTask(token, taskData as Task, activeGroup);
                },
                async (taskId: string) => {
                    const token = await getFreshToken();
                    return await deleteGoogleTask(token, taskId, activeGroup);
                },
                true
            );

            if (result.success && result.task) {
                if (lists && setLists) {
                    const targetListIdx = lists.findIndex(
                        (l) => l.id === pendingRestoreStatus
                    );
                    const doneListIdx = lists.findIndex((l) => l.id === "done");

                    if (targetListIdx !== -1 && startTransition) {
                        startTransition(() => {
                            setLists((prev) => {
                                const copy = [...prev];
                                copy[targetListIdx].tasks = [
                                    ...copy[targetListIdx].tasks,
                                    result.task!,
                                ];

                                if (!result.originalTaskKept && doneListIdx !== -1) {
                                    copy[doneListIdx].tasks = copy[doneListIdx].tasks.filter(
                                        (t: { id: string }) => t.id !== editedTask.id
                                    );
                                }

                                return copy;
                            });
                        });
                    }
                }

                if (result.originalTaskKept && setError) {
                    if (setError) {
                        setError(
                            "Task restored successfully, but original completed task couldn't be deleted automatically. You may need to remove it manually."
                        );
                    }
                }

                setShowRestoreDialog(false);
                setPendingRestoreStatus(null);
                if (setIsDialogOpen) setIsDialogOpen(false);
                if (setSelectedTask) setSelectedTask(null);
                onClose();
            } else {
                throw new Error(result.error || "Failed to restore task");
            }
        } catch (error: any) {
            console.error("Failed to restore task:", error);
            if (setError) {
                setError(`Failed to restore task: ${error.message}`);
            }
            setShowRestoreDialog(false);
            setPendingRestoreStatus(null);
        }
    };

    const handleRestoreCancel = () => {
        setShowRestoreDialog(false);
        setPendingRestoreStatus(null);
    };

    return {
        showRestoreDialog,
        pendingRestoreStatus,
        setShowRestoreDialog,
        setPendingRestoreStatus,
        handleRestoreConfirm,
        handleRestoreCancel,
    };
};