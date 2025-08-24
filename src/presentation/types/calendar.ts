// src/presentation/types/calendar.ts
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: string | Date;
    end?: string | Date; // Make end optional to match useCalendarData
    location?: string;   // Make location optional to match useCalendarData
    calendarId?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: string;
    }>;
    creator?: {
        email: string;
        displayName?: string;
    };
    organizer?: {
        email: string;
        displayName?: string;
    };
    status?: string;
    transparency?: string;
    visibility?: string;
    recurrence?: string[];
    reminders?: {
        useDefault: boolean;
        overrides?: Array<{
            method: string;
            minutes: number;
        }>;
    };
}

export interface GoogleCalendar {
    id: string;
    summary: string;
    description?: string;
    backgroundColor?: string;
    selected?: boolean;
}