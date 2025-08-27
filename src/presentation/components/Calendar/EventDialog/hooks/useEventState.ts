// src/presentation/components/Calendar/EventDialog/hooks/useEventState.ts

import { useState, useEffect } from "react";
import { CalendarEvent, Status } from "../../../../types/calendar";
import { getSuggestedStatusFromDates } from "../utils/eventTransitions";

const hasIncompleteRequiredSubtasks = (event: CalendarEvent | null): boolean => {
    if (!event?.subtasks) return false;
    return event.subtasks.some(
        (subtask) => subtask.requiredCompleted && !subtask.completed
    );
};

export const useEventState = (event: CalendarEvent | null, isCreateMode: boolean) => {
    const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(event);
    const [suggestedStatus, setSuggestedStatus] = useState<Status | null>(null);
    const [isStatusManuallyChanged, setIsStatusManuallyChanged] = useState(false);

    // Reset state when event changes
    useEffect(() => {
        setEditedEvent(event);
        setIsStatusManuallyChanged(false);
    }, [event]);

    // Auto-suggest and auto-apply status when dates change
    useEffect(() => {
        if (editedEvent && !isCreateMode && !isStatusManuallyChanged) {
            const suggested = getSuggestedStatusFromDates(editedEvent);
            setSuggestedStatus(suggested);

            if (suggested && suggested !== editedEvent.status) {
                setEditedEvent(prev => {
                    if (!prev) return prev;

                    let updatedEvent = { ...prev, status: suggested };

                    // For calendar events, we don't auto-set actual times like tasks
                    // Status changes are more about event confirmation state

                    return updatedEvent;
                });
            }
        }
    }, [
        editedEvent?.startDate,
        editedEvent?.startTime,
        editedEvent?.dueDate,
        editedEvent?.dueTime,
        isCreateMode,
        isStatusManuallyChanged
    ]);

    const handleChange = (field: keyof CalendarEvent, value: any) => {
        setEditedEvent((prev) => {
            if (!prev) {
                console.warn("⚠️ useEventState handleChange - no prev event");
                return prev;
            }

            if (field === "status") {
                setIsStatusManuallyChanged(true);
            }

            let updated = { ...prev, [field]: value };

            // In create mode, auto-update status based on dates
            if (
                isCreateMode &&
                (field === "startDate" || field === "startTime" || field === "dueDate" || field === "dueTime")
            ) {
                const suggested = getSuggestedStatusFromDates(updated);
                if (suggested && suggested !== updated.status) {
                    updated.status = suggested;
                }
            }

            return updated;
        });
    };

    // Handle system-triggered status changes (from validation dialog)
    const handleSystemStatusChange = (newStatus: Status, additionalFields?: Partial<CalendarEvent>) => {
        // Block transition to confirmed if there are incomplete required subtasks
        if (newStatus === "confirmed" && hasIncompleteRequiredSubtasks(editedEvent)) {
            console.warn("Cannot transition to confirmed: incomplete required subtasks exist");
            return;
        }

        setEditedEvent(prev => {
            if (!prev) return prev;

            let updatedEvent = { ...prev, status: newStatus, ...additionalFields };

            // Set actual times if needed for confirmed events
            if (newStatus === "confirmed" && !prev.actualEndDate) {
                const now = new Date();
                updatedEvent.actualEndDate = now;
                updatedEvent.actualEndTime = now;
            }

            if (newStatus === "confirmed" && (!prev.actualStartTime || !prev.actualStartDate)) {
                const now = new Date();
                updatedEvent.actualStartTime = prev.startTime || now;
                updatedEvent.actualStartDate = prev.startDate || now;
            }

            return updatedEvent;
        });

        // Reset manual flag to allow future auto-suggestions when dates change
        setIsStatusManuallyChanged(false);
    };

    const getEffectiveStatus = (): Status => {
        if (!editedEvent) return "tentative";
        if (isCreateMode) return editedEvent.status || "tentative";

        if (editedEvent.status === "confirmed" || editedEvent.status === "cancelled") {
            return editedEvent.status;
        }

        const effectiveStatus =
            suggestedStatus && suggestedStatus !== editedEvent.status ? suggestedStatus : editedEvent.status;

        return effectiveStatus || "tentative";
    };

    return {
        editedEvent,
        setEditedEvent,
        handleChange,
        handleSystemStatusChange,
        suggestedStatus: null, // Always return null to hide UI suggestion
        getEffectiveStatus
    };
};