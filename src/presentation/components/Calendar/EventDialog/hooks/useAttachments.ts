// src/presentation/components/TaskManager/TaskDialog/hooks/useAttachments.ts
import { useState } from "react";
import { Task, Attachment } from "../../../../types/task";

export const useAttachments = (
    editedTask: Task | null,
    setEditedTask: (task: Task) => void,
    addActivityLog: (action: string, details: string) => void
) => {
    const [newAttachment, setNewAttachment] = useState({
        title: "",
        url: "",
        type: "file" as "image" | "video" | "audio" | "file" | "other",
    });

    const handleAddAttachment = () => {
        if (!newAttachment.url.trim()) return;
        const newAtt: Attachment = {
            id: Date.now().toString(),
            title: newAttachment.title || "Attachment",
            url: newAttachment.url,
            type: newAttachment.type,
        };
        setEditedTask({
            ...editedTask!,
            attachments: [...(editedTask!.attachments || []), newAtt],
        });
        setNewAttachment({ title: "", url: "", type: "file" });
        addActivityLog(
            "attachment_added",
            `Added attachment: "${newAtt.title}" (${newAtt.type})`
        );
    };

    const handleDeleteAttachment = (id: string) => {
        const attachment = editedTask!.attachments?.find((att) => att.id === id);
        setEditedTask({
            ...editedTask!,
            attachments: editedTask!.attachments?.filter((att) => att.id !== id) || [],
        });
        if (attachment) {
            addActivityLog(
                "attachment_removed",
                `Removed attachment: "${attachment.title}"`
            );
        }
    };

    return {
        newAttachment,
        setNewAttachment,
        handleAddAttachment,
        handleDeleteAttachment,
    };
};