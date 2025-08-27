export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "confirmed" | "tentative" | "cancelled";

export interface Subtask {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    linkedTaskId?: string;
    requiredCompleted?: boolean;
}

export interface Attachment {
    id: string;
    title: string;
    url: string;
    type: "image" | "video" | "audio" | "file" | "other";
}

export interface Recurrence {
    type: string;
    interval: number;
    endDate?: Date | null;
    endAfterOccurrences?: number | null;
}

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;

    collection?: string;


    startDate: Date | null;
    startTime: Date | null;
    dueDate: Date | null;
    dueTime: Date | null;

    actualStartDate: Date | null;
    actualStartTime: Date | null;
    actualEndDate: Date | null;
    actualEndTime: Date | null;

    timeZone?: string;

    location?: string;
    locationName?: string;
    locationAddress?: string;
    locationCoordinates?: string;

    priority?: Priority;
    tags?: string[];
    subtasks?: Subtask[];
    attachments?: Attachment[];

    recurrence?: Recurrence;

    reminders?: number[];
    createdAt?: string;
    updatedAt?: string;
}

export interface GoogleCalendar {
    id: string;
    summary: string;
    description?: string;
    backgroundColor?: string;
    selected?: boolean;
}

// Helper function to combine date and time into a single Date object
export function combineDateTime(date: Date | null, time: Date | null): Date | null {
    if (!date) return null;
    const combined = new Date(date);
    if (time) {
        combined.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
    }
    return combined;
}

// Helper function to get current timezone
export function getCurrentTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Helper function to format timezone for display
export function formatTimeZone(timeZone?: string): string {
    if (!timeZone) return '';

    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en', {
            timeZone,
            timeZoneName: 'short'
        });

        const parts = formatter.formatToParts(now);
        const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';

        return `${timeZone} (${timeZoneName})`;
    } catch (error) {
        return timeZone;
    }
}