// src/presentation/components/TaskManager/TaskDialog/hooks/useTags.ts - Debug version
import { useState } from "react";
import { Task } from "../../../../types/task";

export const useTags = (
    editedTask: Task | null,
    handleChange: (field: keyof Task, value: any) => void,
    addActivityLog: (action: string, details: string) => void
) => {
    const [newTag, setNewTag] = useState("");

    const handleAddTag = (tagToAdd?: string) => {

        // Use passed tag or current newTag state
        const finalTag = tagToAdd || newTag;

        if (!finalTag.trim() || !editedTask) {
            return;
        }

        // Check if tag already exists (case-insensitive)
        const existingTags = editedTask?.tags || [];

        const tagExists = existingTags.some(
            (tag) => tag.toLowerCase() === finalTag.toLowerCase()
        );

        if (tagExists) {
            console.warn("Tag already exists:", finalTag);
            return;
        }

        // Update the task using handleChange (similar to CollectionSection)
        const newTags = [...existingTags, finalTag];

        // Add activity log FIRST
        addActivityLog("tag_added", `Added tag: "${finalTag}"`);

        // Then update tags
        handleChange("tags", newTags);

        // Clear input state
        setNewTag("");
    };

    const handleDeleteTag = (tag: string) => {

        if (!editedTask) {
            return;
        }

        const newTags = editedTask.tags?.filter((t) => t !== tag) || [];

        // Add activity log FIRST
        addActivityLog("tag_removed", `Removed tag: "${tag}"`);

        // Then update tags 
        handleChange("tags", newTags);
    };

    return {
        newTag,
        setNewTag,
        handleAddTag,
        handleDeleteTag,
    };
};