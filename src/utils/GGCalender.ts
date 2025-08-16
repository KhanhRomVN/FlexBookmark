import { CalendarEvent } from "../presentation/tab/TaskAndEvent";

// Helper function to safely parse dates
function safeDateParse(dateStr: string): Date {
    if (!dateStr) return new Date();

    try {
        const date = new Date(dateStr);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string: ${dateStr}, using current date as fallback`);
            return new Date();
        }

        return date;
    } catch (error) {
        console.warn(`Error parsing date: ${dateStr}`, error);
        return new Date();
    }
}

export async function fetchGoogleEvents(token: string) {
    const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch Google Calendar events");
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => {
        const startStr = item.start?.dateTime || item.start?.date;
        const endStr = item.end?.dateTime || item.end?.date;

        const start = startStr ? safeDateParse(startStr) : new Date();
        const end = endStr ? safeDateParse(endStr) : start;

        return {
            id: item.id,
            title: item.summary || "No title",
            description: item.description || "",
            start,
            end,
        };
    });
}

export async function createGoogleEvent(accessToken: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const eventData = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
            dateTime: event.start?.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: event.end?.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: event.attendees?.map((email: any) => ({ email }))
    };

    const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        }
    );

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }
        throw new Error(`Failed to create event: ${response.status}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        title: data.summary || 'Untitled Event',
        start: safeDateParse(data.start.dateTime || data.start.date),
        end: safeDateParse(data.end.dateTime || data.end.date),
        description: data.description,
        location: data.location,
        attendees: data.attendees?.map((attendee: any) => attendee.email) || []
    };
}