import { CalendarEvent, GoogleCalendar } from "../presentation/types/calendar";

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

export async function fetchGoogleCalendars(token: string): Promise<GoogleCalendar[]> {
    const response = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch Google Calendars");
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || "Unnamed Calendar",
        description: item.description || "",
        backgroundColor: item.backgroundColor || "#3B82F6",
        selected: item.selected !== false, // Default to true unless explicitly false
    }));
}

export async function fetchGoogleEvents(token: string): Promise<CalendarEvent[]> {
    // First, fetch all calendars
    const calendarsResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!calendarsResponse.ok) {
        throw new Error("Failed to fetch calendars");
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items || [];

    // Fetch events from all calendars
    const allEvents: CalendarEvent[] = [];

    for (const calendar of calendars) {
        try {
            const eventsResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${new Date().toISOString()}&maxResults=100&singleEvents=true&orderBy=startTime`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                const calendarEvents = (eventsData.items || []).map((item: any) => {
                    const startStr = item.start?.dateTime || item.start?.date;
                    const endStr = item.end?.dateTime || item.end?.date;

                    const start = startStr ? safeDateParse(startStr) : new Date();
                    const end = endStr ? safeDateParse(endStr) : start;

                    return {
                        id: item.id,
                        title: item.summary || "No title",
                        description: item.description || "",
                        location: item.location || "",
                        start,
                        end,
                        calendarId: calendar.id,
                        attendees: (item.attendees || []).map((attendee: any) => attendee.email).filter(Boolean),
                    };
                });

                allEvents.push(...calendarEvents);
            }
        } catch (error) {
            console.warn(`Failed to fetch events from calendar ${calendar.summary}:`, error);
        }
    }

    return allEvents;
}

export async function createGoogleEvent(accessToken: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const eventData = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
            dateTime: event.start?.toString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: event.end?.toString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: event.attendees?.map((email: any) => ({ email }))
    };

    const calendarId = event.calendarId || 'primary';
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
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
        attendees: data.attendees?.map((attendee: any) => attendee.email) || [],
        calendarId: calendarId,
    };
}