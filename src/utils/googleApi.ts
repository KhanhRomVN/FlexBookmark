// FlexBookmark/src/utils/googleApi.ts
import { CalendarEvent, Task } from '@/presentation/tab/TaskAndEvent';

/**
 * Lấy sự kiện Google Calendar
 * @param accessToken OAuth2 access token
 */
export const fetchGoogleEvents = async (accessToken: string): Promise<CalendarEvent[]> => {
    const timeMin = new Date().toISOString();

    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    if (!res.ok) {
        console.error('Lỗi lấy Google Calendar:', await res.text());
        return [];
    }

    const data = await res.json();

    return data.items?.map((event: any) => ({
        id: event.id || '',
        title: event.summary || '',
        start: event.start?.dateTime
            ? new Date(event.start.dateTime)
            : event.start?.date
                ? new Date(`${event.start.date}T00:00:00Z`)
                : new Date(),
        end: event.end?.dateTime
            ? new Date(event.end.dateTime)
            : event.end?.date
                ? new Date(`${event.end.date}T00:00:00Z`)
                : new Date(),
        description: event.description || '',
        location: event.location || '',
        attendees: event.attendees?.map((a: any) => a.email || '') || []
    })) || [];
};

/**
 * Lấy task từ Google Tasks
 * @param accessToken OAuth2 access token
 */
export const fetchGoogleTasks = async (accessToken: string): Promise<Task[]> => {
    const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=true&showHidden=true`,
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    if (!res.ok) {
        console.error('Lỗi lấy Google Tasks:', await res.text());
        return [];
    }

    const data = await res.json();

    return data.items?.map((task: any) => ({
        id: task.id || '',
        title: task.title || '',
        due: task.due ? new Date(task.due) : undefined,
        completed: task.status === 'completed',
        notes: task.notes || ''
    })) || [];
};
