// src/presentation/components/TaskManager/TaskDialog/hooks/useSubtasks.ts - FIXED: Follow tags pattern exactly
import { useState } from "react";
import { Task, Subtask } from "../../../../types/task";

export const useSubtasks = (
    editedTask: Task | null,
    handleChange: (field: keyof Task, value: any) => void, // Use handleChange instead of setEditedTask
    addActivityLog: (action: string, details: string) => void
) => {
    const [newSubtask, setNewSubtask] = useState("");

    const handleSubtaskChange = (id: string, field: keyof Subtask, value: any) => {

        if (!editedTask) {
            console.warn("⚠️ No editedTask available for subtask change");
            return;
        }

        const currentSubtasks = editedTask.subtasks || [];

        const updatedSubtasks = currentSubtasks.map((st) =>
            st.id === id ? { ...st, [field]: value } : st
        );

        // Log the specific change for better tracking
        const subtask = currentSubtasks.find(st => st.id === id);
        if (subtask && field === 'completed') {
            addActivityLog(
                value ? "subtask_completed" : "subtask_uncompleted",
                `${value ? 'Completed' : 'Uncompleted'} subtask: "${subtask.title}"`
            );
        } else if (subtask && field === 'title') {
            addActivityLog("subtask_updated", `Updated subtask: "${value}"`);
        }

        // FIXED: Use handleChange exactly like tags
        handleChange("subtasks", updatedSubtasks);
    };

    // FIXED: Simplified add subtask using handleChange pattern exactly like tags
    const handleAddSubtask = (subtaskData?: Partial<Subtask>) => {

        if (!editedTask) {
            console.warn("⚠️ No editedTask available for adding subtask");
            return;
        }

        let newSub: Subtask;

        if (subtaskData && typeof subtaskData === 'object') {
            // Enhanced mode: create from object data
            if (!subtaskData.title?.trim()) {
                console.warn("⚠️ No title provided for subtask");
                return;
            }

            newSub = {
                id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                title: subtaskData.title.trim(),
                description: subtaskData.description || "",
                completed: false,
                linkedTaskId: subtaskData.linkedTaskId || undefined,
                requiredCompleted: subtaskData.requiredCompleted || false,
            };
        } else {
            // Simple mode: create from newSubtask string
            if (!newSubtask.trim()) {
                console.warn("⚠️ No newSubtask text available");
                return;
            }

            newSub = {
                id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                title: newSubtask.trim(),
                description: "",
                completed: false,
            };
        }

        // Get current subtasks array
        const currentSubtasks = editedTask.subtasks || [];

        const updatedSubtasks = [...currentSubtasks, newSub];

        // Add activity log FIRST (exactly like tags)
        addActivityLog("subtask_added", `Added subtask: "${newSub.title}"`);

        // FIXED: Use handleChange exactly like tags
        handleChange("subtasks", updatedSubtasks);

        // Clear input state if using simple mode
        if (!subtaskData) {
            setNewSubtask("");
        }
    };

    const handleDeleteSubtask = (id: string) => {

        if (!editedTask) {
            console.warn("⚠️ No editedTask available for deleting subtask");
            return;
        }

        const currentSubtasks = editedTask.subtasks || [];

        const subtask = currentSubtasks.find((st) => st.id === id);
        const updatedSubtasks = currentSubtasks.filter((st) => st.id !== id);

        // Add activity log FIRST (exactly like tags)
        if (subtask) {
            addActivityLog("subtask_removed", `Removed subtask: "${subtask.title}"`);
        }

        // FIXED: Use handleChange exactly like tags
        handleChange("subtasks", updatedSubtasks);
    };

    return {
        newSubtask,
        setNewSubtask,
        handleSubtaskChange,
        handleAddSubtask,
        handleDeleteSubtask,
    };
};