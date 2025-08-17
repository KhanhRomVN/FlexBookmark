// src/utils/GGTask.ts - Fixed version

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

// Helper function to get fresh token with proper scopes
async function getFreshToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken(
            {
                interactive: true,
                scopes: [
                    'openid',
                    'email',
                    'profile',
                    'https://www.googleapis.com/auth/tasks',
                    'https://www.googleapis.com/auth/tasks.readonly'
                ]
            },
            (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (token) {
                    resolve(token);
                } else {
                    reject(new Error('No token received'));
                }
            }
        );
    });
}

// Helper function to make authenticated requests with retry logic
async function makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
    retryCount: number = 0
): Promise<Response> {
    const maxRetries = 2;

    try {
        const response = await fetch(url, options);

        // If forbidden and we haven't retried yet, try to get fresh token
        if (response.status === 403 && retryCount < maxRetries) {
            console.log('Getting fresh token due to 403 error...');
            const freshToken = await getFreshToken();

            const newOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${freshToken}`
                }
            };

            return makeAuthenticatedRequest(url, newOptions, retryCount + 1);
        }

        return response;
    } catch (error) {
        if (retryCount < maxRetries) {
            console.log('Retrying request due to error:', error);
            const freshToken = await getFreshToken();

            const newOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${freshToken}`
                }
            };

            return makeAuthenticatedRequest(url, newOptions, retryCount + 1);
        }
        throw error;
    }
}

export async function fetchGoogleTasks(token: string, tasklistId: string = '@default') {
    const response = await makeAuthenticatedRequest(
        `https://www.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch Google Tasks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => {
        // Parse due date from API or from our custom metadata in notes
        let dueDate = item.due ? safeDateParse(item.due) : undefined;
        let taskData: any = {};

        try {
            const meta = JSON.parse(item.notes || "{}");
            taskData = meta;
            if (meta.endTime) {
                const parsedEnd = typeof meta.endTime === "string"
                    ? safeDateParse(meta.endTime)
                    : undefined;
                if (parsedEnd) {
                    dueDate = parsedEnd;
                }
            }
        } catch (error) {
            // If notes is not JSON, treat as description
            taskData.description = item.notes || "";
        }

        const task: Task = {
            id: item.id,
            title: item.title || "No title",
            description: taskData.description || "",
            status: taskData.status || (item.status === 'completed' ? 'done' : 'todo'),
            priority: taskData.priority || 'medium',
            startTime: taskData.startTime ? safeDateParse(taskData.startTime) : null,
            endTime: dueDate || null,
            completed: item.status === 'completed',
            subtasks: taskData.subtasks || [],
            attachments: taskData.attachments || [],
            tags: taskData.tags || [],
            activityLog: taskData.activityLog || [],
            prevTaskId: taskData.prevTaskId || null,
            nextTaskId: taskData.nextTaskId || null,
        };

        return task;
    });
}

export const createGoogleTask = async (
    accessToken: string,
    task: Partial<Task>,
    taskListId: string
): Promise<Task> => {
    // Prepare the task data for Google Tasks API
    const googleTaskData = {
        title: task.title,
        notes: JSON.stringify({
            description: task.description,
            status: task.status,
            priority: task.priority,
            startTime: task.startTime?.toISOString(),
            endTime: task.endTime?.toISOString(),
            subtasks: task.subtasks,
            attachments: task.attachments,
            tags: task.tags,
            activityLog: task.activityLog,
            prevTaskId: task.prevTaskId,
            nextTaskId: task.nextTaskId
        }),
        due: task.endTime ? task.endTime.toISOString().split('T')[0] : undefined,
        status: task.completed ? 'completed' : 'needsAction'
    };

    console.log('Creating task with data:', googleTaskData);

    const response = await makeAuthenticatedRequest(
        `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleTaskData),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Create task error response:', errorText);
        throw new Error(`Failed to create task: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Task created successfully:', data);

    return {
        ...task,
        id: data.id,
        completed: data.status === 'completed',
        endTime: data.due ? safeDateParse(data.due) : task.endTime
    };
};

export const updateGoogleTask = async (
    accessToken: string,
    taskId: string,
    task: Task,
    taskListId: string
): Promise<Task> => {
    const googleTaskData = {
        title: task.title,
        notes: JSON.stringify({
            description: task.description,
            status: task.status,
            priority: task.priority,
            startTime: task.startTime?.toISOString(),
            endTime: task.endTime?.toISOString(),
            subtasks: task.subtasks,
            attachments: task.attachments,
            tags: task.tags,
            activityLog: task.activityLog,
            prevTaskId: task.prevTaskId,
            nextTaskId: task.nextTaskId
        }),
        due: task.endTime ? task.endTime.toISOString().split('T')[0] : undefined,
        status: task.completed ? 'completed' : 'needsAction'
    };

    const response = await makeAuthenticatedRequest(
        `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleTaskData),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Update task error response:', errorText);
        throw new Error(`Failed to update task: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
        ...task,
        completed: data.status === 'completed',
        endTime: data.due ? safeDateParse(data.due) : task.endTime
    };
};

export const deleteGoogleTask = async (
    accessToken: string,
    taskId: string,
    taskListId: string
): Promise<void> => {
    const response = await makeAuthenticatedRequest(
        `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText} - ${errorText}`);
    }
};

export async function fetchGoogleTaskGroups(accessToken: string) {
    const response = await makeAuthenticatedRequest(
        "https://www.googleapis.com/tasks/v1/users/@me/lists",
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tasklists API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.items || [];
}

// Helper function to verify token and scopes
export async function verifyTokenScopes(token: string): Promise<any> {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
        if (response.ok) {
            const tokenInfo = await response.json();
            console.log('Token info:', tokenInfo);
            return tokenInfo;
        }
    } catch (error) {
        console.error('Error verifying token:', error);
    }
    return null;
}