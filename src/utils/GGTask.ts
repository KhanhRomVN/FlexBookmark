import type { Task } from "../presentation/types/task";

// Helper function to safely parse dates
function safeDateParse(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
        // Handle date-only format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Date(`${dateStr}T07:00:00.000Z`);
        }

        // Handle date-time format
        let normalizedDateStr = dateStr;

        // If it has T but no timezone, add Z
        if (dateStr.includes("T") && !dateStr.includes("Z") && !dateStr.includes("+") && !dateStr.includes("-", 10)) {
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
        // Parse due date from API or from our custom metadata in notes
        let dueDate = item.due ? safeDateParse(item.due) : undefined;
        try {
            const meta = JSON.parse(item.notes || "{}");
            if (meta.endTime) {
                const parsedEnd = typeof meta.endTime === "string"
                    ? safeDateParse(meta.endTime)
                    : undefined;
                if (parsedEnd) {
                    dueDate = parsedEnd;
                }
            }
        } catch (error) {
            console.warn(`Failed to parse task notes for time metadata:`, error);
        }

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

        // Debug log for non-completed tasks
        if (!task.completed && dueDate) {
            console.log(`[fetchGoogleTasks] Non-completed task "${task.title}" due at ${dueDate.toISOString()}`);
        }

        return task;
    });
}

export const createGoogleTask = async (
    accessToken: string,
    task: Task,
    taskListId: string
): Promise<Task> => {
    const response = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: task.title,
                notes: JSON.stringify({
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    subtasks: task.subtasks,
                    attachments: task.attachments,
                    tags: task.tags,
                    prevTaskId: task.prevTaskId,
                    nextTaskId: task.nextTaskId
                }),
                due: task.endTime ? task.endTime.toISOString() : undefined,
                completed: task.completed ? new Date().toISOString() : undefined
            }),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to create task');
    }

    const data = await response.json();
    return {
        ...task,
        id: data.id,
        completed: !!data.completed,
        endTime: data.due ? new Date(data.due) : undefined
    };
};

export const updateGoogleTask = async (
    accessToken: string,
    taskId: string,
    task: Task,
    taskListId: string
): Promise<Task> => {
    const response = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: task.title,
                notes: JSON.stringify({
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    subtasks: task.subtasks,
                    attachments: task.attachments,
                    tags: task.tags,
                    prevTaskId: task.prevTaskId,
                    nextTaskId: task.nextTaskId
                }),
                due: task.endTime ? task.endTime.toISOString() : undefined,
                completed: task.completed ? new Date().toISOString() : undefined
            }),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to update task');
    }

    const data = await response.json();
    return {
        ...task,
        completed: !!data.completed,
        endTime: data.due ? new Date(data.due) : undefined
    };
};

export const deleteGoogleTask = async (
    accessToken: string,
    taskId: string,
    taskListId: string
): Promise<void> => {
    const response = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to delete task');
    }
};

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

