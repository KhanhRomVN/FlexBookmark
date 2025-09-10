// src/presentation/tab/TaskManager/components/TaskDialog/hooks/useTaskDialog.ts
import { useState, useEffect, useCallback } from "react";
import { Task, Status, Attachment, Subtask } from "../../../types/task";
import { getTransitionScenarios, executeStatusTransition as runStatusTransition } from "../utils/taskTransitions";
import { GoogleTasksStatusHandler } from "../utils/GGTaskStatusHandler";
import { getSuggestedStatusFromDates } from "../utils/taskTransitions";

export const useTaskDialog = (
    task: Task | null,
    isCreateMode: boolean,
    onSave: (task: Task) => void,
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
    // State từ useTaskState
    const [editedTask, setEditedTask] = useState<Task | null>(task);
    const [suggestedStatus, setSuggestedStatus] = useState<Status | null>(null);
    const [isStatusManuallyChanged, setIsStatusManuallyChanged] = useState(false);

    // State từ useGoogleTasksIntegration
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [pendingRestoreStatus, setPendingRestoreStatus] = useState<Status | null>(null);

    // State từ useStatusTransitions
    const [pendingTransition, setPendingTransition] = useState<{
        from: Status;
        to: Status;
        scenarios: any[];
    } | null>(null);
    const [showTransitionDialog, setShowTransitionDialog] = useState(false);

    // State từ useAttachments
    const [newAttachment, setNewAttachment] = useState({
        title: "",
        url: "",
        type: "file" as "image" | "video" | "audio" | "file" | "other",
    });

    // State từ useSubtasks
    const [newSubtask, setNewSubtask] = useState("");

    // State từ useTags
    const [newTag, setNewTag] = useState("");

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

    // Helper functions
    const hasIncompleteRequiredSubtasks = (task: Task | null): boolean => {
        if (!task?.subtasks) return false;
        return task.subtasks.some(
            (subtask) => subtask.requiredCompleted && !subtask.completed
        );
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

    // Activity Log
    const addActivityLog = (action: string, details: string) => {
        if (isCreateMode) return;
        const now = new Date();
        const activityEntry = {
            id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
            details,
            action,
            userId: "user",
            timestamp: now,
        };
        setEditedTask({
            ...editedTask!,
            activityLog: [...(editedTask!.activityLog || []), activityEntry],
        });
    };

    // Task State Management
    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask((prev) => {
            if (!prev) return prev;
            if (field === "status") {
                setIsStatusManuallyChanged(true);
            }
            let updated = { ...prev, [field]: value };
            if (isCreateMode &&
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

    const handleSystemStatusChange = (newStatus: Status, additionalFields?: Partial<Task>) => {
        if (newStatus === "done" && hasIncompleteRequiredSubtasks(editedTask)) {
            console.warn("Cannot transition to done: incomplete required subtasks exist");
            return;
        }
        setEditedTask(prev => {
            if (!prev) return prev;
            let updatedTask = { ...prev, status: newStatus, ...additionalFields };
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
        setIsStatusManuallyChanged(false);
    };

    // Status Transitions
    const handleStatusChange = (newStatus: Status) => {
        if (!editedTask) return;
        const currentStatus = getEffectiveStatus();
        const scenarios = getTransitionScenarios(currentStatus, newStatus, editedTask);

        if (newStatus === "done" && hasIncompleteRequiredSubtasks(editedTask)) {
            setPendingTransition({
                from: currentStatus,
                to: newStatus,
                scenarios: [{
                    title: "Incomplete Required Subtasks",
                    options: [{
                        label: "Complete the task anyway",
                        value: "force_complete",
                        description: "Mark the task as done even though some required subtasks are incomplete"
                    }, { label: "Cancel", value: "cancel" }]
                }]
            });
            setShowTransitionDialog(true);
            return;
        }

        if (scenarios.length > 0) {
            setPendingTransition({ from: currentStatus, to: newStatus, scenarios });
            setShowTransitionDialog(true);
            return;
        }

        executeStatusTransition(currentStatus, newStatus, {});
    };

    const executeStatusTransition = useCallback(
        (from: Status, to: Status, selectedOptions: Record<string, string>, shouldSave: boolean = false) => {
            if (!editedTask) return;
            const updatedTask = runStatusTransition(editedTask, from, to, selectedOptions, isCreateMode);
            if ("error" in updatedTask) return;
            setEditedTask(updatedTask);
            if (shouldSave) onSave(updatedTask);
        },
        [editedTask, isCreateMode, onSave]
    );

    // Google Tasks Integration
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
                    const targetListIdx = lists.findIndex((l) => l.id === pendingRestoreStatus);
                    const doneListIdx = lists.findIndex((l) => l.id === "done");
                    if (targetListIdx !== -1 && startTransition) {
                        startTransition(() => {
                            setLists((prev) => {
                                const copy = [...prev];
                                copy[targetListIdx].tasks = [...copy[targetListIdx].tasks, result.task!];
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
                    setError("Task restored successfully, but original completed task couldn't be deleted automatically.");
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
            if (setError) setError(`Failed to restore task: ${error.message}`);
            setShowRestoreDialog(false);
            setPendingRestoreStatus(null);
        }
    };

    const handleRestoreCancel = () => {
        setShowRestoreDialog(false);
        setPendingRestoreStatus(null);
    };

    // Attachments
    const handleAddAttachment = () => {
        if (!newAttachment.url.trim() || !editedTask) return;
        const newAtt: Attachment = {
            id: Date.now().toString(),
            title: newAttachment.title || "Attachment",
            url: newAttachment.url,
            type: newAttachment.type,
        };
        setEditedTask({
            ...editedTask,
            attachments: [...(editedTask.attachments || []), newAtt],
        });
        setNewAttachment({ title: "", url: "", type: "file" });
        addActivityLog("attachment_added", `Added attachment: "${newAtt.title}" (${newAtt.type})`);
    };

    const handleDeleteAttachment = (id: string) => {
        if (!editedTask) return;
        const attachment = editedTask.attachments?.find((att) => att.id === id);
        setEditedTask({
            ...editedTask,
            attachments: editedTask.attachments?.filter((att) => att.id !== id) || [],
        });
        if (attachment) {
            addActivityLog("attachment_removed", `Removed attachment: "${attachment.title}"`);
        }
    };

    // Subtasks
    const handleSubtaskChange = (id: string, field: keyof Subtask, value: any) => {
        if (!editedTask) return;
        const currentSubtasks = editedTask.subtasks || [];
        const updatedSubtasks = currentSubtasks.map((st) =>
            st.id === id ? { ...st, [field]: value } : st
        );
        const subtask = currentSubtasks.find(st => st.id === id);
        if (subtask && field === 'completed') {
            addActivityLog(
                value ? "subtask_completed" : "subtask_uncompleted",
                `${value ? 'Completed' : 'Uncompleted'} subtask: "${subtask.title}"`
            );
        } else if (subtask && field === 'title') {
            addActivityLog("subtask_updated", `Updated subtask: "${value}"`);
        }
        handleChange("subtasks", updatedSubtasks);
    };

    const handleAddSubtask = (subtaskData?: Partial<Subtask>) => {
        if (!editedTask) return;
        let newSub: Subtask;
        if (subtaskData && typeof subtaskData === 'object') {
            if (!subtaskData.title?.trim()) return;
            newSub = {
                id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                title: subtaskData.title.trim(),
                description: subtaskData.description || "",
                completed: false,
                linkedTaskId: subtaskData.linkedTaskId || undefined,
                requiredCompleted: subtaskData.requiredCompleted || false,
            };
        } else {
            if (!newSubtask.trim()) return;
            newSub = {
                id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                title: newSubtask.trim(),
                description: "",
                completed: false,
            };
        }
        const currentSubtasks = editedTask.subtasks || [];
        const updatedSubtasks = [...currentSubtasks, newSub];
        addActivityLog("subtask_added", `Added subtask: "${newSub.title}"`);
        handleChange("subtasks", updatedSubtasks);
        if (!subtaskData) setNewSubtask("");
    };

    const handleDeleteSubtask = (id: string) => {
        if (!editedTask) return;
        const currentSubtasks = editedTask.subtasks || [];
        const subtask = currentSubtasks.find((st) => st.id === id);
        const updatedSubtasks = currentSubtasks.filter((st) => st.id !== id);
        if (subtask) addActivityLog("subtask_removed", `Removed subtask: "${subtask.title}"`);
        handleChange("subtasks", updatedSubtasks);
    };

    // Tags
    const handleAddTag = (tagToAdd?: string) => {
        const finalTag = tagToAdd || newTag;
        if (!finalTag.trim() || !editedTask) return;
        const existingTags = editedTask?.tags || [];
        const tagExists = existingTags.some(
            (tag) => tag.toLowerCase() === finalTag.toLowerCase()
        );
        if (tagExists) return;
        const newTags = [...existingTags, finalTag];
        addActivityLog("tag_added", `Added tag: "${finalTag}"`);
        handleChange("tags", newTags);
        setNewTag("");
    };

    const handleDeleteTag = (tag: string) => {
        if (!editedTask) return;
        const newTags = editedTask.tags?.filter((t) => t !== tag) || [];
        addActivityLog("tag_removed", `Removed tag: "${tag}"`);
        handleChange("tags", newTags);
    };

    return {
        // State
        editedTask,
        suggestedStatus,
        showRestoreDialog,
        pendingRestoreStatus,
        pendingTransition,
        showTransitionDialog,
        newAttachment,
        newSubtask,
        newTag,

        // Setters
        setEditedTask,
        setNewAttachment,
        setNewSubtask,
        setNewTag,
        setShowRestoreDialog,
        setPendingRestoreStatus,
        setShowTransitionDialog,
        setPendingTransition,

        // Functions
        addActivityLog,
        handleChange,
        handleSystemStatusChange,
        getEffectiveStatus,
        handleStatusChange,
        executeStatusTransition,
        handleRestoreConfirm,
        handleRestoreCancel,
        handleAddAttachment,
        handleDeleteAttachment,
        handleSubtaskChange,
        handleAddSubtask,
        handleDeleteSubtask,
        handleAddTag,
        handleDeleteTag
    };
};