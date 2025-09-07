// src/presentation/components/EventManager/EventDialog/hooks/useAttachments.ts
import { useState } from "react";
import { CalendarEvent, Attachment } from "../../../types";

export const useAttachments = (
    editedEvent: CalendarEvent | null,
    setEditedEvent: (event: CalendarEvent) => void,
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
        setEditedEvent({
            ...editedEvent!,
            attachments: [...(editedEvent!.attachments || []), newAtt],
        });
        setNewAttachment({ title: "", url: "", type: "file" });
        addActivityLog(
            "attachment_added",
            `Added attachment: "${newAtt.title}" (${newAtt.type})`
        );
    };

    const handleDeleteAttachment = (id: string) => {
        const attachment = editedEvent!.attachments?.find((att) => att.id === id);
        setEditedEvent({
            ...editedEvent!,
            attachments: editedEvent!.attachments?.filter((att) => att.id !== id) || [],
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