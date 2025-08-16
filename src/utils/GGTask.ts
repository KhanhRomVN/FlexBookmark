import { Task } from "../presentation/tab/TaskAndEvent";

// Helper function to safely parse dates
function safeDateParse(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
        // Handle different date formats from Google Tasks API
        let normalizedDateStr = dateStr;

        // If it's just a date (YYYY-MM-DD), add time component
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            normalizedDateStr = dateStr + "T00:00:00.000Z";
        }
        // If it has T but no timezone, add Z
        else if (dateStr.includes("T") && !dateStr.includes("Z") && !dateStr.includes("+") && !dateStr.includes("-", 10)) {
            normalizedDateStr = dateStr + "Z";
        }

        const date = new Date(normalizedDateStr);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string: ${dateStr}`);
            return undefined;
        }

        return date;
    } catch (error) {
        console.warn(`Error parsing date: ${dateStr}`, error);
        return undefined;
    }
}

export async function fetchGoogleTasks(token: string, tasklistId: string = '@default') {
    const response = await fetch(
        `https://www.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch Google Tasks");
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => {
        const dueDate = item.due ? safeDateParse(item.due) : undefined;

        const task = {
            id: item.id,
            title: item.title || "No title",
            notes: item.notes || "",
            status: item.status,
            completed: item.status === 'completed',
            due: dueDate,
        };

        // Log any tasks that had invalid dates for debugging
        if (item.due && !task.due) {
            console.warn(`Task "${task.title}" had invalid due date: ${item.due}`);
        }

        return task;
    });
}

export async function createGoogleTask(
    accessToken: string,
    task: Partial<Task>,
    listId: string
): Promise<Task> {
    const taskData = {
        title: task.title,
        notes: `folder: ${task.folder}\n${task.notes || ''}`,
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
        due: data.due ? safeDateParse(data.due) : undefined,
        completed: data.status === 'completed',
        notes: data.notes,
        folder: task.folder || 'todo'
    };
}

export async function updateGoogleTask(
    accessToken: string,
    taskId: string,
    updates: Partial<Task>,
    listId: string
): Promise<Task> {
    // Preserve folder information in notes
    let notes = updates.notes || '';

    // Update folder information if it changed
    if (updates.folder) {
        // Remove existing folder line
        notes = notes.replace(/^folder:\s*.*$/gm, '').trim();
        // Add new folder line
        notes = `folder: ${updates.folder}\n${notes}`;
    }

    const taskData: any = {
        title: updates.title,
        notes: notes,
        due: updates.due?.toISOString(),
        status: updates.completed ? 'completed' : 'needsAction'
    };

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
        due: data.due ? safeDateParse(data.due) : undefined,
        completed: data.status === 'completed',
        notes: data.notes,
        folder: updates.folder || 'todo'
    };
}

export async function fetchGoogleTaskGroups(accessToken: string) {
    const response = await fetch(
        "https://www.googleapis.com/tasks/v1/users/@me/lists",
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) throw new Error(`Tasklists API error: ${response.status}`);
    const data = await response.json();
    return data.items || [];
}