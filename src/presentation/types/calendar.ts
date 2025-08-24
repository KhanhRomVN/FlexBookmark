export interface CalendarEvent {
    location: any;
    description: any;
    id: string;
    title: string;
    start: Date | string;
    end?: Date | string;
    calendarId?: string;
}
