import { CalendarEvent, Task } from "../presentation/tab/TaskAndEvent";

/**
 * Fetch Google Calendar events using OAuth2 access token
 */
export const fetchGoogleEvents = async (
    accessToken: string
): Promise<CalendarEvent[]> => {
    const timeMin = new Date().toISOString();
    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
            timeMin
        )}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );
    if (!res.ok) {
        console.error("Google Calendar API error:", await res.text());
        return [];
    }
    const data = await res.json();
    return (
        data.items?.map((event: any) => ({
            id: event.id || "",
            title: event.summary || "",
            start: event.start?.dateTime
                ? new Date(event.start.dateTime)
                : new Date(`${event.start.date}T00:00:00Z`),
            end: event.end?.dateTime
                ? new Date(event.end.dateTime)
                : new Date(`${event.end.date}T23:59:59Z`),
            description: event.description || "",
            location: event.location || "",
            attendees: event.attendees?.map((a: any) => a.email) || [],
        })) || []
    );
};

/**
 * Fetch Google Tasks using OAuth2 access token
 */
export const fetchGoogleTasks = async (
    accessToken: string
): Promise<Task[]> => {
    const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=true&showHidden=true&maxResults=100`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );
    if (!res.ok) {
        console.error("Google Tasks API error:", await res.text());
        return [];
    }
    const data = await res.json();
    return (
        data.items?.map((task: any) => ({
            id: task.id || "",
            title: task.title || "",
            due: task.due ? new Date(task.due) : undefined,
            completed: task.status === "completed",
            notes: task.notes || "",
        })) || []
    );
};
