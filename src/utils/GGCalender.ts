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

                        // Extract separate date and time components
                        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                        const startTime = new Date();
                        startTime.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);

                        const dueDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                        const dueTime = new Date();
                        dueTime.setHours(end.getHours(), end.getMinutes(), end.getSeconds(), 0);

                        // Parse extended properties if available
                        const extendedProps = item.extendedProperties?.shared || {};
                        let tags: string[] = [];
                        let subtasks: any[] = [];
                        let attachments: any[] = [];

                        try {
                            if (extendedProps.tags) {
                                tags = JSON.parse(extendedProps.tags);
                            }
                        } catch (e) {
                            console.warn('Failed to parse tags:', e);
                        }

                        try {
                            if (extendedProps.subtasks) {
                                subtasks = JSON.parse(extendedProps.subtasks);
                            }
                        } catch (e) {
                            console.warn('Failed to parse subtasks:', e);
                        }

                        try {
                            if (extendedProps.attachments) {
                                attachments = JSON.parse(extendedProps.attachments);
                            }
                        } catch (e) {
                            console.warn('Failed to parse attachments:', e);
                        }

                        // Parse reminders
                        let reminders: number[] = [];
                        if (item.reminders && !item.reminders.useDefault && item.reminders.overrides) {
                            reminders = item.reminders.overrides
                                .filter((override: any) => override.method === 'popup')
                                .map((override: any) => override.minutes);
                        }

                        return {
                            id: item.id,
                            summary: item.summary || "No title",
                            description: item.description || "",

                            // New separate date/time fields
                            startDate,
                            startTime,
                            dueDate,
                            dueTime,

                            // Legacy fields for backward compatibility
                            start,
                            end,

                            // Location fields
                            location: item.location || "",
                            locationName: extendedProps.locationName || "",
                            locationAddress: extendedProps.locationAddress || "",
                            locationCoordinates: extendedProps.locationCoordinates || "",

                            // Event properties
                            priority: (extendedProps.priority as 'low' | 'medium' | 'high') || 'medium',
                            tags,
                            subtasks,
                            attachments,
                            completed: false,

                            // Reminders and recurrence
                            reminders: reminders.length > 0 ? reminders : undefined,
                            recurrence: item.recurrence ? parseGoogleRecurrence(item.recurrence) : undefined,

                            // Google Calendar specific
                            calendarId: calendar.id,
                            attendees: (item.attendees || []).map((attendee: any) => attendee.email).filter(Boolean),
                            timeZone: item.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                            status: item.status,
                            created: item.created,
                            updated: item.updated,
                            creator: item.creator,
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

function parseGoogleRecurrence(recurrenceArray: string[]): CalendarEvent['recurrence'] {
    if (!recurrenceArray || recurrenceArray.length === 0) return undefined;

    const rrule = recurrenceArray[0];
    if (!rrule.startsWith('RRULE:')) return undefined;

    const rules = rrule.substring(6).split(';');
    const recurrence: NonNullable<CalendarEvent['recurrence']> = {
        type: 'none',
        interval: 1,
        endDate: null,
        endAfterOccurrences: null,
    };

    for (const rule of rules) {
        const [key, value] = rule.split('=');
        switch (key) {
            case 'FREQ':
                recurrence.type = value.toLowerCase();
                break;
            case 'INTERVAL':
                recurrence.interval = parseInt(value) || 1;
                break;
            case 'UNTIL':
                try {
                    recurrence.endDate = safeDateParse(value);
                } catch (e) {
                    console.warn('Failed to parse recurrence end date:', e);
                }
                break;
            case 'COUNT':
                recurrence.endAfterOccurrences = parseInt(value) || null;
                break;
        }
    }

    return recurrence.type !== 'none' ? recurrence : undefined;
}

export async function createGoogleEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent> {
    console.log("Creating Google Calendar event:", event);

    // Convert separate date/time fields to combined datetime
    let startDateTime: Date;
    let endDateTime: Date;

    if (event.startDate && event.startTime) {
        startDateTime = new Date(event.startDate);
        startDateTime.setHours(
            event.startTime.getHours(),
            event.startTime.getMinutes(),
            event.startTime.getSeconds(),
            0
        );
    } else if (event.start) {
        startDateTime = event.start;
    } else {
        throw new Error("Start date and time are required");
    }

    if (event.dueDate && event.dueTime) {
        endDateTime = new Date(event.dueDate);
        endDateTime.setHours(
            event.dueTime.getHours(),
            event.dueTime.getMinutes(),
            event.dueTime.getSeconds(),
            0
        );
    } else if (event.end) {
        endDateTime = event.end;
    } else {
        // Default to 1 hour after start
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
    }

    // Validate event data
    const validation = validateEventData({
        ...event,
        start: startDateTime,
        end: endDateTime
    });
    if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.errors.join(", ")}`);
    }

    // Prepare event data for Google Calendar API
    const eventData = {
        summary: event.summary.trim(),
        description: event.description || "",
        location: event.location || "",
        start: {
            dateTime: formatDateForGoogle(startDateTime),
            timeZone: event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: formatDateForGoogle(endDateTime),
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

        // Convert the response back to our CalendarEvent format with separate fields
        const responseStart = safeDateParse(data.start.dateTime || data.start.date);
        const responseEnd = safeDateParse(data.end.dateTime || data.end.date);

        const createdEvent: CalendarEvent = {
            ...event,
            id: data.id,
            summary: data.summary || event.summary,

            // Update separate date/time fields
            startDate: new Date(responseStart.getFullYear(), responseStart.getMonth(), responseStart.getDate()),
            startTime: new Date(0, 0, 0, responseStart.getHours(), responseStart.getMinutes(), responseStart.getSeconds()),
            dueDate: new Date(responseEnd.getFullYear(), responseEnd.getMonth(), responseEnd.getDate()),
            dueTime: new Date(0, 0, 0, responseEnd.getHours(), responseEnd.getMinutes(), responseEnd.getSeconds()),

            // Update legacy fields
            start: responseStart,
            end: responseEnd,

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

    // Convert separate date/time fields to combined datetime
    let startDateTime: Date;
    let endDateTime: Date;

    if (event.startDate && event.startTime) {
        startDateTime = new Date(event.startDate);
        startDateTime.setHours(
            event.startTime.getHours(),
            event.startTime.getMinutes(),
            event.startTime.getSeconds(),
            0
        );
    } else if (event.start) {
        startDateTime = event.start;
    } else {
        throw new Error("Start date and time are required");
    }

    if (event.dueDate && event.dueTime) {
        endDateTime = new Date(event.dueDate);
        endDateTime.setHours(
            event.dueTime.getHours(),
            event.dueTime.getMinutes(),
            event.dueTime.getSeconds(),
            0
        );
    } else if (event.end) {
        endDateTime = event.end;
    } else {
        // Default to 1 hour after start
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);
    }

    // Validate event data
    const validation = validateEventData({
        ...event,
        start: startDateTime,
        end: endDateTime
    });
    if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.errors.join(", ")}`);
    }

    const eventData = {
        summary: event.summary.trim(),
        description: event.description || "",
        location: event.location || "",
        start: {
            dateTime: formatDateForGoogle(startDateTime),
            timeZone: event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: formatDateForGoogle(endDateTime),
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

        // Convert the response back to our CalendarEvent format with separate fields
        const responseStart = safeDateParse(data.start.dateTime || data.start.date);
        const responseEnd = safeDateParse(data.end.dateTime || data.end.date);

        return {
            ...event,
            summary: data.summary || event.summary,

            // Update separate date/time fields
            startDate: new Date(responseStart.getFullYear(), responseStart.getMonth(), responseStart.getDate()),
            startTime: new Date(0, 0, 0, responseStart.getHours(), responseStart.getMinutes(), responseStart.getSeconds()),
            dueDate: new Date(responseEnd.getFullYear(), responseEnd.getMonth(), responseEnd.getDate()),
            dueTime: new Date(0, 0, 0, responseEnd.getHours(), responseEnd.getMinutes(), responseEnd.getSeconds()),

            // Update legacy fields
            start: responseStart,
            end: responseEnd,

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