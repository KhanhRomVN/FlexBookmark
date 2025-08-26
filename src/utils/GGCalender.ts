// src/utils/GGCalender.ts

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

// Helper function to format Date to ISO string for Google Calendar API
function formatDateForGoogle(date: Date): string {
    return date.toISOString();
}

// Helper function to validate event data before sending to API
function validateEventData(event: CalendarEvent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.summary || !event.summary.trim()) {
        errors.push("Event summary is required");
    }

    if (!event.start || !(event.start instanceof Date) || isNaN(event.start.getTime())) {
        errors.push("Valid start date is required");
    }

    if (!event.end || !(event.end instanceof Date) || isNaN(event.end.getTime())) {
        errors.push("Valid end date is required");
    }

    if (event.start && event.end && event.end <= event.start) {
        errors.push("End date must be after start date");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export async function fetchGoogleCalendars(token: string): Promise<GoogleCalendar[]> {
    try {
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("UNAUTHORIZED");
            }
            throw new Error(`HTTP ${response.status}: Failed to fetch Google Calendars`);
        }

        const data = await response.json();

        return (data.items || []).map((item: any) => ({
            id: item.id,
            summary: item.summary || "Unnamed Calendar",
            description: item.description || "",
            backgroundColor: item.backgroundColor || "#3B82F6",
            selected: item.selected !== false, // Default to true unless explicitly false
        }));
    } catch (error) {
        console.error("Error fetching Google Calendars:", error);
        throw error;
    }
}

export async function fetchGoogleEvents(token: string): Promise<CalendarEvent[]> {
    try {
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
            if (calendarsResponse.status === 401) {
                throw new Error("UNAUTHORIZED");
            }
            throw new Error(`HTTP ${calendarsResponse.status}: Failed to fetch calendars`);
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
                            summary: item.summary || "No title",
                            description: item.description || "",
                            location: item.location || "",
                            start,
                            end,
                            calendarId: calendar.id,
                            attendees: (item.attendees || []).map((attendee: any) => attendee.email).filter(Boolean),
                            // Add default values for required fields
                            priority: 'medium' as const,
                            tags: [],
                            subtasks: [],
                            attachments: [],
                            completed: false,
                            timeZone: item.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                        };
                    });

                    allEvents.push(...calendarEvents);
                } else if (eventsResponse.status === 401) {
                    throw new Error("UNAUTHORIZED");
                }
            } catch (error) {
                console.warn(`Failed to fetch events from calendar ${calendar.summary}:`, error);
                // Don't throw here, just skip this calendar
            }
        }

        return allEvents;
    } catch (error) {
        console.error("Error fetching Google Events:", error);
        throw error;
    }
}

export async function createGoogleEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent> {
    console.log("Creating Google Calendar event:", event);

    // Validate event data
    const validation = validateEventData(event);
    if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.errors.join(", ")}`);
    }

    // Prepare event data for Google Calendar API
    const eventData = {
        summary: event.summary.trim(),
        description: event.description || "",
        location: event.location || "",
        start: {
            dateTime: formatDateForGoogle(event.start),
            timeZone: event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: formatDateForGoogle(event.end),
            timeZone: event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: event.attendees?.filter(Boolean).map((email: string) => ({ email })) || [],
        // Store custom properties in extendedProperties
        extendedProperties: {
            shared: {
                tags: JSON.stringify(event.tags || []),
                priority: event.priority || 'medium',
                subtasks: JSON.stringify(event.subtasks || []),
                attachments: JSON.stringify(event.attachments || []),
                locationName: event.locationName || '',
                locationAddress: event.locationAddress || '',
                locationCoordinates: event.locationCoordinates || '',
            }
        },
        // Set up reminders
        reminders: event.reminders && event.reminders.length > 0 ? {
            useDefault: false,
            overrides: event.reminders.map(minutes => ({
                method: 'popup' as const,
                minutes
            }))
        } : { useDefault: true },
        // Handle recurrence
        ...(event.recurrence && event.recurrence.type !== 'none' && {
            recurrence: generateRRULE(event.recurrence)
        })
    };

    const calendarId = event.calendarId || 'primary';

    console.log("Sending event data to Google API:", eventData);

    try {
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

        const responseText = await response.text();
        console.log("Google API Response status:", response.status);
        console.log("Google API Response text:", responseText);

        if (!response.ok) {
            console.error('Google Calendar API Error:', responseText);

            if (response.status === 401) {
                throw new Error('UNAUTHORIZED');
            }

            let errorMessage = `Failed to create event: ${response.status}`;
            try {
                const errorData = JSON.parse(responseText);
                if (errorData.error?.message) {
                    errorMessage += ` - ${errorData.error.message}`;
                }
            } catch (e) {
                errorMessage += ` - ${responseText}`;
            }

            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseText);
        console.log("Event created successfully:", data);

        // Convert the response back to our CalendarEvent format
        const createdEvent: CalendarEvent = {
            ...event, // Keep all the original event data
            id: data.id,
            summary: data.summary || event.summary,
            start: safeDateParse(data.start.dateTime || data.start.date),
            end: safeDateParse(data.end.dateTime || data.end.date),
            description: data.description || event.description,
            location: data.location || event.location,
            attendees: data.attendees?.map((attendee: any) => attendee.email) || event.attendees || [],
            calendarId: calendarId,
            status: data.status,
            created: data.created,
            updated: data.updated,
        };

        return createdEvent;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        throw error;
    }
}

export async function updateGoogleEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent> {
    console.log("Updating Google Calendar event:", event);

    // Validate event data
    const validation = validateEventData(event);
    if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.errors.join(", ")}`);
    }

    const eventData = {
        summary: event.summary.trim(),
        description: event.description || "",
        location: event.location || "",
        start: {
            dateTime: formatDateForGoogle(event.start),
            timeZone: event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: formatDateForGoogle(event.end),
            timeZone: event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: event.attendees?.filter(Boolean).map((email: string) => ({ email })) || [],
        extendedProperties: {
            shared: {
                tags: JSON.stringify(event.tags || []),
                priority: event.priority || 'medium',
                subtasks: JSON.stringify(event.subtasks || []),
                attachments: JSON.stringify(event.attachments || []),
                locationName: event.locationName || '',
                locationAddress: event.locationAddress || '',
                locationCoordinates: event.locationCoordinates || '',
            }
        },
        reminders: event.reminders && event.reminders.length > 0 ? {
            useDefault: false,
            overrides: event.reminders.map(minutes => ({
                method: 'popup' as const,
                minutes
            }))
        } : { useDefault: true },
        ...(event.recurrence && event.recurrence.type !== 'none' && {
            recurrence: generateRRULE(event.recurrence)
        })
    };

    const calendarId = event.calendarId || 'primary';

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.id}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Calendar API Error:', errorText);

            if (response.status === 401) {
                throw new Error('UNAUTHORIZED');
            }
            throw new Error(`Failed to update event: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return {
            ...event,
            summary: data.summary || event.summary,
            start: safeDateParse(data.start.dateTime || data.start.date),
            end: safeDateParse(data.end.dateTime || data.end.date),
            description: data.description || event.description,
            location: data.location || event.location,
            attendees: data.attendees?.map((attendee: any) => attendee.email) || event.attendees || [],
            updated: data.updated,
        };
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        throw error;
    }
}

export async function deleteGoogleEvent(accessToken: string, eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Calendar API Error:', errorText);

            if (response.status === 401) {
                throw new Error('UNAUTHORIZED');
            }
            if (response.status === 404) {
                throw new Error('Event not found');
            }
            throw new Error(`Failed to delete event: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        throw error;
    }
}

// Helper function to generate RRULE string for recurrence
function generateRRULE(recurrence: NonNullable<CalendarEvent['recurrence']>): string[] {
    const { type, interval, endDate, endAfterOccurrences } = recurrence;

    if (type === 'none') return [];

    let rrule = '';

    switch (type) {
        case 'daily':
            rrule = `RRULE:FREQ=DAILY;INTERVAL=${interval}`;
            break;
        case 'weekly':
            rrule = `RRULE:FREQ=WEEKLY;INTERVAL=${interval}`;
            break;
        case 'monthly':
            rrule = `RRULE:FREQ=MONTHLY;INTERVAL=${interval}`;
            break;
        case 'yearly':
            rrule = `RRULE:FREQ=YEARLY;INTERVAL=${interval}`;
            break;
        default:
            return [];
    }

    if (endDate) {
        rrule += `;UNTIL=${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    } else if (endAfterOccurrences) {
        rrule += `;COUNT=${endAfterOccurrences}`;
    }

    return [rrule];
}