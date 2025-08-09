import { CalendarEvent, Task } from "../presentation/tab/TaskAndEvent";

// Google Calendar API
export async function fetchGoogleEvents(accessToken: string): Promise<CalendarEvent[]> {
    try {
        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${encodeURIComponent(timeMin)}&` +
            `timeMax=${encodeURIComponent(timeMax)}&` +
            `singleEvents=true&` +
            `orderBy=startTime&` +
            `maxResults=50`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('UNAUTHORIZED');
            }
            throw new Error(`Calendar API error: ${response.status}`);
        }

        const data = await response.json();

        return (data.items || []).map((item: any): CalendarEvent => {
            const start = item.start?.dateTime ? new Date(item.start.dateTime) : new Date(item.start?.date || new Date());
            const end = item.end?.dateTime ? new Date(item.end.dateTime) : new Date(item.end?.date || start);

            return {
                id: item.id,
                title: item.summary || 'Untitled Event',
                start,
                end,
                description: item.description,
                location: item.location,
                attendees: item.attendees?.map((attendee: any) => attendee.email) || []
            };
        });
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            throw error; // Re-throw auth errors to handle token refresh
        }
        return [];
    }
}

// Google Tasks API
export async function fetchGoogleTasks(accessToken: string): Promise<Task[]> {
    try {
        // First, get task lists
        const taskListsResponse = await fetch(
            'https://www.googleapis.com/tasks/v1/users/@me/lists',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!taskListsResponse.ok) {
            if (taskListsResponse.status === 401) {
                throw new Error('UNAUTHORIZED');
            }
            throw new Error(`Tasks API error: ${taskListsResponse.status}`);
        }

        const taskListsData = await taskListsResponse.json();
        const taskLists = taskListsData.items || [];

        if (taskLists.length === 0) {
            return [];
        }

        // Fetch tasks from all task lists
        const allTasks: Task[] = [];

        for (const taskList of taskLists) {
            try {
                const tasksResponse = await fetch(
                    `https://www.googleapis.com/tasks/v1/lists/${taskList.id}/tasks?` +
                    `maxResults=50&` +
                    `showCompleted=true&` +
                    `showDeleted=false`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (tasksResponse.ok) {
                    const tasksData = await tasksResponse.json();
                    const tasks = (tasksData.items || []).map((item: any): Task => ({
                        id: item.id,
                        title: item.title || 'Untitled Task',
                        due: item.due ? new Date(item.due) : undefined,
                        completed: item.status === 'completed',
                        notes: item.notes
                    }));

                    allTasks.push(...tasks);
                }
            } catch (error) {
                console.error(`Error fetching tasks from list ${taskList.title}:`, error);
            }
        }

        return allTasks;
    } catch (error) {
        console.error('Error fetching Google Tasks:', error);
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            throw error; // Re-throw auth errors to handle token refresh
        }
        return [];
    }
}

// Create a new calendar event
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
        attendees: event.attendees?.map(email => ({ email }))
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
        start: new Date(data.start.dateTime || data.start.date),
        end: new Date(data.end.dateTime || data.end.date),
        description: data.description,
        location: data.location,
        attendees: data.attendees?.map((attendee: any) => attendee.email) || []
    };
}

// Create a new task
export async function createGoogleTask(accessToken: string, task: Partial<Task>, taskListId?: string): Promise<Task> {
    // If no task list ID provided, get the default one
    let listId = taskListId;

    if (!listId) {
        const taskListsResponse = await fetch(
            'https://www.googleapis.com/tasks/v1/users/@me/lists',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (taskListsResponse.ok) {
            const taskListsData = await taskListsResponse.json();
            const taskLists = taskListsData.items || [];
            listId = taskLists[0]?.id; // Use first task list
        }
    }

    if (!listId) {
        throw new Error('No task list available');
    }

    const taskData = {
        title: task.title,
        notes: task.notes,
        due: task.due?.toISOString(),
        status: task.completed ? 'completed' : 'needsAction'
    };

    const response = await fetch(
        `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        }
    );

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }
        throw new Error(`Failed to create task: ${response.status}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        title: data.title || 'Untitled Task',
        due: data.due ? new Date(data.due) : undefined,
        completed: data.status === 'completed',
        notes: data.notes
    };
}

// Update a task
export async function updateGoogleTask(
    accessToken: string,
    taskId: string,
    updates: Partial<Task>,
    taskListId?: string
): Promise<Task> {
    // Similar to create, get task list if not provided
    let listId = taskListId;

    if (!listId) {
        const taskListsResponse = await fetch(
            'https://www.googleapis.com/tasks/v1/users/@me/lists',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (taskListsResponse.ok) {
            const taskListsData = await taskListsResponse.json();
            const taskLists = taskListsData.items || [];
            listId = taskLists[0]?.id;
        }
    }

    if (!listId) {
        throw new Error('No task list available');
    }

    const taskData: any = {};
    if (updates.title !== undefined) taskData.title = updates.title;
    if (updates.notes !== undefined) taskData.notes = updates.notes;
    if (updates.due !== undefined) taskData.due = updates.due?.toISOString();
    if (updates.completed !== undefined) taskData.status = updates.completed ? 'completed' : 'needsAction';

    const response = await fetch(
        `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        }
    );

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }
        throw new Error(`Failed to update task: ${response.status}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        title: data.title || 'Untitled Task',
        due: data.due ? new Date(data.due) : undefined,
        completed: data.status === 'completed',
        notes: data.notes
    };
}