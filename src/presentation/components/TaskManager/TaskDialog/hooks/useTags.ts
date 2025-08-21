// src/presentation/components/TaskManager/TaskDialog/hooks/useTags.ts
import { useState } from "react";
import { Task } from "../../../../types/task";

export const useTags = (
    editedTask: Task | null,
    setEditedTask: (task: Task) => void,
    addActivityLog: (action: string, details: string) => void
) => {
    const [newTag, setNewTag] = useState("");

    const handleAddTag = () => {
        if (!newTag.trim()) return;
        setEditedTask({
            ...editedTask!,
            tags: [...(editedTask!.tags || []), newTag],
        });
        setNewTag("");
        addActivityLog("tag_added", `Added tag: "${newTag}"`);
    };

    const handleDeleteTag = (tag: string) => {
        setEditedTask({
            ...editedTask!,
            tags: editedTask!.tags?.filter((t) => t !== tag) || [],
        });
        addActivityLog("tag_removed", `Removed tag: "${tag}"`);
    };

    return {
        newTag,
        setNewTag,
        handleAddTag,
        handleDeleteTag,
    };
};