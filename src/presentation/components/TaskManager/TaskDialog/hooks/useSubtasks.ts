// src/presentation/components/TaskManager/TaskDialog/hooks/useSubtasks.ts
import { useState } from "react";
import { Task, Subtask } from "../../../../types/task";

export const useSubtasks = (
    editedTask: Task | null,
    setEditedTask: (task: Task) => void,
    addActivityLog: (action: string, details: string) => void
) => {
    const [newSubtask, setNewSubtask] = useState("");

    const handleSubtaskChange = (id: string, field: keyof Subtask, value: any) => {
        setEditedTask({
            ...editedTask!,
            subtasks: editedTask!.subtasks?.map((st) =>
                st.id === id ? { ...st, [field]: value } : st
            ) || [],
        });
    };

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        const newSub: Subtask = {
            id: Date.now().toString(),
            title: newSubtask,
            completed: false,
        };
        setEditedTask({
            ...editedTask!,
            subtasks: [...(editedTask!.subtasks || []), newSub],
        });
        setNewSubtask("");
        addActivityLog("subtask_added", `Added subtask: "${newSubtask}"`);
    };

    const handleDeleteSubtask = (id: string) => {
        const subtask = editedTask!.subtasks?.find((st) => st.id === id);
        setEditedTask({
            ...editedTask!,
            subtasks: editedTask!.subtasks?.filter((st) => st.id !== id) || [],
        });
        if (subtask) {
            addActivityLog("subtask_removed", `Removed subtask: "${subtask.title}"`);
        }
    };

    return {
        newSubtask,
        setNewSubtask,
        handleSubtaskChange,
        handleAddSubtask,
        handleDeleteSubtask,
    };
};