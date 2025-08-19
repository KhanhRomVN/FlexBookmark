// src/utils/GGTask.ts - Updated version with fixed auto-set default times

import type { Task } from "../presentation/types/task";

// Google Tasks API limits
const MAX_NOTES_LENGTH = 4095; // Google Tasks notes limit
const MAX_TITLE_LENGTH = 1023; // Google Tasks title limit

// Helper function to safely parse dates
function safeDateParse(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
        // Handle time-only format (HH:MM:SS.sssZ)
        if (/^\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateStr)) {
            // Create a date for today and set the time
            const today = new Date();
            const timeDate = new Date(`${today.toISOString().split('T')[0]}T${dateStr}`);
            return isNaN(timeDate.getTime()) ? undefined : timeDate;
        }

        // Handle date-only format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const date = new Date(`${dateStr}T00:00:00.000Z`);
            return isNaN(date.getTime()) ? undefined : date;
        }

        // Handle full date-time format
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
            (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (!result?.token) {
                    reject(new Error('No token received'));
                } else {
                    resolve(result.token);
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

// Helper to create simplified task notes with full format
function createTaskNotes(task: Partial<Task>): { notes: string; characterCount: number; isOverLimit: boolean } {
    try {
        // Build complete metadata object with consistent format
        const metadata: any = {
            // Core fields
            description: task.description || "",
            status: task.status || 'backlog',
            priority: task.priority || "",
            folder: task.folder || "", // ADD: Include folder field
        };

        // Format dates and times consistently - CHỈ KHI CÓ GIÁ TRỊ
        if (task.startTime && task.startTime instanceof Date && !isNaN(task.startTime.getTime())) {
            const timeStr = task.startTime.toISOString().split('T')[1];
            metadata.startTime = timeStr;
        } else {
            metadata.startTime = ""; // Để trống
        }

        if (task.dueTime && task.dueTime instanceof Date && !isNaN(task.dueTime.getTime())) {
            const timeStr = task.dueTime.toISOString().split('T')[1];
            metadata.dueTime = timeStr;
        } else {
            metadata.dueTime = ""; // Để trống
        }

        if (task.startDate && task.startDate instanceof Date && !isNaN(task.startDate.getTime())) {
            metadata.startDate = task.startDate.toISOString().split('T')[0];
        } else {
            metadata.startDate = ""; // Để trống
        }

        if (task.dueDate && task.dueDate instanceof Date && !isNaN(task.dueDate.getTime())) {
            metadata.dueDate = task.dueDate.toISOString().split('T')[0];
        } else {
            metadata.dueDate = ""; // Để trống
        }

        // Always include arrays (empty if not provided)
        metadata.subtasks = task.subtasks || [];
        metadata.attachments = task.attachments || [];
        metadata.tags = task.tags || [];

        // Activity log - chỉ thêm khi thực sự là task mới
        let activityLog = task.activityLog || [];

        // If this is a new task (no existing activity log AND no ID), add creation entry
        if (activityLog.length === 0 && !task.id) {
            const now = new Date();
            const entryId = `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`;
            const creationEntry = {
                id: entryId,
                details: `Task created at ${now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                })}`,
                action: "created",
                userId: "system",
                timestamp: now
            };
            activityLog = [creationEntry];
        }
        metadata.activityLog = activityLog;

        let jsonString = JSON.stringify(metadata, null, 0);
        let characterCount = jsonString.length;
        let isOverLimit = characterCount > MAX_NOTES_LENGTH;

        console.log(`Metadata JSON length: ${characterCount}/${MAX_NOTES_LENGTH}`);

        // If over limit, progressively reduce size while maintaining format
        if (isOverLimit) {
            console.warn(`Metadata too large (${characterCount}/${MAX_NOTES_LENGTH}), reducing size...`);

            // First, limit activity log entries
            if (metadata.activityLog && metadata.activityLog.length > 5) {
                metadata.activityLog = metadata.activityLog.slice(-5);
                jsonString = JSON.stringify(metadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by limiting activity log entries');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Remove attachments if still too large
            if (metadata.attachments && metadata.attachments.length > 0) {
                metadata.attachments = [];
                jsonString = JSON.stringify(metadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by clearing attachments');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Limit subtasks
            if (metadata.subtasks && metadata.subtasks.length > 5) {
                metadata.subtasks = metadata.subtasks.slice(0, 5);
                jsonString = JSON.stringify(metadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by limiting subtasks');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Truncate description
            if (metadata.description && metadata.description.length > 500) {
                metadata.description = metadata.description.substring(0, 500) + "...";
                jsonString = JSON.stringify(metadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by truncating description');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Last resort: keep minimal structure but maintain format
            if (isOverLimit) {
                console.warn('Using minimal metadata due to size constraints');
                const minimalMetadata = {
                    description: (metadata.description || "").substring(0, 100),
                    status: metadata.status,
                    priority: metadata.priority,
                    folder: metadata.folder,
                    startTime: "",
                    dueTime: "",
                    startDate: "",
                    dueDate: "",
                    subtasks: [],
                    attachments: [],
                    tags: [],
                    activityLog: metadata.activityLog?.slice(-1) || [],
                };
                jsonString = JSON.stringify(minimalMetadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;
            }
        }

        return { notes: jsonString, characterCount, isOverLimit };
    } catch (error) {
        console.error('Error creating task notes:', error);
        // Return minimal safe metadata without default times
        const safeMetadata = {
            description: task.description || "",
            status: task.status || 'backlog',
            priority: task.priority || "",
            folder: task.folder || "", // ADD: Include folder in safe metadata
            startTime: "",
            dueTime: "",
            startDate: "",
            dueDate: "",
            subtasks: [],
            attachments: [],
            tags: [],
            activityLog: [{
                id: `${new Date().getTime()}-${Math.random().toString(36).substring(2, 8)}`,
                details: `Task created at ${new Date().toLocaleString()}`,
                action: "created",
                userId: "system",
                timestamp: new Date()
            }],
        };
        const jsonString = JSON.stringify(safeMetadata, null, 0);
        return {
            notes: jsonString,
            characterCount: jsonString.length,
            isOverLimit: jsonString.length > MAX_NOTES_LENGTH
        };
    }
}

// Helper to format due date for Google Tasks API (RFC 3339 date-time format)
function formatDueDateTime(date: Date | null | undefined): string | undefined {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return undefined;
    }

    try {
        return date.toISOString();
    } catch (error) {
        console.error('Error formatting due date:', error);
        return undefined;
    }
}

// Helper to validate task data before sending to API
function validateTaskData(taskData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check title
    if (!taskData.title || typeof taskData.title !== 'string' || taskData.title.trim() === "") {
        errors.push("Title is required and must be a non-empty string");
    } else if (taskData.title.length > MAX_TITLE_LENGTH) {
        errors.push(`Title too long (${taskData.title.length}/${MAX_TITLE_LENGTH})`);
    }

    // Check notes length
    if (taskData.notes && taskData.notes.length > MAX_NOTES_LENGTH) {
        errors.push(`Notes too long (${taskData.notes.length}/${MAX_NOTES_LENGTH})`);
    }

    // Validate due date format (should be ISO string if present)
    if (taskData.due) {
        try {
            const dueDate = new Date(taskData.due);
            if (isNaN(dueDate.getTime())) {
                errors.push("Invalid due date format");
            }
        } catch (e) {
            errors.push("Invalid due date format");
        }
    }

    // Validate status
    if (taskData.status && !['needsAction', 'completed'].includes(taskData.status)) {
        errors.push("Invalid status - must be 'needsAction' or 'completed'");
    }

    return { isValid: errors.length === 0, errors };
}

// Modified function - chỉ set default times khi được yêu cầu explicit
function setDefaultTaskTimes(): { startTime: Date; dueTime: Date; startDate: Date; dueDate: Date } {
    const now = new Date();

    // Set start time to current time (rounded to next 15-minute interval)
    const startTime = new Date(now);
    const minutes = startTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    startTime.setMinutes(roundedMinutes, 0, 0);

    // Set end time to 1 hour after start time
    const dueTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // Set start date to today (beginning of day in UTC to avoid timezone issues)
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Set end date to tomorrow (beginning of day in UTC)
    const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return { startTime, dueTime, startDate, dueDate };
}

export async function fetchGoogleTasks(token: string, tasklistId: string = '@default') {
    const response = await makeAuthenticatedRequest(
        `https://www.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=true&showHidden=true`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch tasks error:', errorText);
        throw new Error(`Failed to fetch Google Tasks: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => {
        // Parse metadata from notes
        let taskData: any = {};

        try {
            if (item.notes) {
                const parsedNotes = JSON.parse(item.notes);
                taskData = parsedNotes;
            }
        } catch (error) {
            // If notes is not JSON, treat as description
            taskData.description = item.notes || "";
        }

        const task: Task = {
            id: item.id,
            title: item.title || "Untitled Task",
            description: taskData.description || "",
            status: taskData.status || (item.status === 'completed' ? 'done' : 'todo'),
            priority: taskData.priority || "",
            folder: taskData.folder || "", // ADD: Parse folder field
            startTime: taskData.startTime ? safeDateParse(taskData.startTime) : null,
            dueTime: taskData.dueTime ? safeDateParse(taskData.dueTime) : null,
            startDate: taskData.startDate ? safeDateParse(taskData.startDate) : null,
            dueDate: taskData.dueDate ? safeDateParse(taskData.dueDate) : null,
            completed: item.status === 'completed',
            subtasks: taskData.subtasks || [],
            attachments: taskData.attachments || [],
            tags: taskData.tags || [],
            activityLog: taskData.activityLog || [],
            updatedAt: "",
            createdAt: ""
        };

        return task;
    });
}

export const createGoogleTask = async (
    accessToken: string,
    task: Partial<Task>,
    taskListId: string
): Promise<Task> => {
    try {
        console.log('Creating task with input:', {
            title: task.title,
            status: task.status,
            priority: task.priority,
        });

        // KHÔNG TỰ ĐỘNG SET DEFAULT TIMES - chỉ dùng những gì user nhập
        const taskWithDefaults = { ...task };

        // Prepare minimal task data for Google Tasks API
        const googleTaskData: any = {
            title: (taskWithDefaults.title || "New Task").trim().substring(0, MAX_TITLE_LENGTH)
        };

        // Set status (Google Tasks only supports 'needsAction' and 'completed')
        googleTaskData.status = taskWithDefaults.completed ? 'completed' : 'needsAction';

        // Add due date CHỈ KHI CÓ (use dueDate or dueTime)
        const dueDate = taskWithDefaults.dueDate || taskWithDefaults.dueTime;
        if (dueDate instanceof Date && !isNaN(dueDate.getTime())) {
            googleTaskData.due = formatDueDateTime(dueDate);
        }

        // Create notes with metadata
        const { notes, isOverLimit } = createTaskNotes(taskWithDefaults);
        if (notes && !isOverLimit) {
            googleTaskData.notes = notes;
        } else if (taskWithDefaults.description) {
            // Fallback: just save description if metadata is too large
            googleTaskData.notes = taskWithDefaults.description.substring(0, MAX_NOTES_LENGTH - 100);
        }

        // Clean up any undefined values
        Object.keys(googleTaskData).forEach(key => {
            if (googleTaskData[key] === undefined || googleTaskData[key] === null) {
                delete googleTaskData[key];
            }
        });

        // Validate data
        const validation = validateTaskData(googleTaskData);
        if (!validation.isValid) {
            console.error('Task data validation failed:', validation.errors);
            throw new Error(`Invalid task data: ${validation.errors.join(', ')}`);
        }

        console.log('Sending to Google Tasks API:', {
            ...googleTaskData,
            notesLength: googleTaskData.notes?.length || 0,
        });

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

            try {
                const errorData = JSON.parse(errorText);
                console.error('Detailed error:', errorData);

                if (errorData.error?.message) {
                    throw new Error(`Google Tasks API Error: ${errorData.error.message}`);
                }
            } catch (parseError) {
                // If we can't parse the error, just throw the original
            }

            throw new Error(`Failed to create task: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Task created successfully:', data.id);

        // Return the task với chỉ những gì user đã nhập - KHÔNG thêm default times
        // Fix: Ensure all required Task properties are included
        return {
            id: data.id,
            title: data.title || taskWithDefaults.title || "New Task",
            description: taskWithDefaults.description || "",
            status: taskWithDefaults.status || 'todo',
            priority: taskWithDefaults.priority || 'medium', // Fix: Use valid Priority type
            // CHỈ GIỮ LẠI THỜI GIAN NẾU USER ĐÃ NHẬP
            startTime: taskWithDefaults.startTime || null,
            dueTime: taskWithDefaults.dueTime || null,
            startDate: taskWithDefaults.startDate || null,
            dueDate: taskWithDefaults.dueDate || null,
            completed: data.status === 'completed',
            subtasks: taskWithDefaults.subtasks || [],
            attachments: taskWithDefaults.attachments || [],
            tags: taskWithDefaults.tags || [],
            activityLog: taskWithDefaults.activityLog || [],
            createdAt: data.updated || new Date().toISOString(), // Fix: Add required property
            updatedAt: data.updated || new Date().toISOString(), // Fix: Add required property
        };
    } catch (error) {
        console.error('Error in createGoogleTask:', error);
        throw error;
    }
};

export const updateGoogleTask = async (
    accessToken: string,
    taskId: string,
    task: Task,
    taskListId: string
): Promise<Task> => {
    try {
        // Prepare minimal task data for Google Tasks API
        const googleTaskData: any = {
            id: taskId,
            title: (task.title || "Updated Task").trim().substring(0, MAX_TITLE_LENGTH)
        };

        // Set status
        googleTaskData.status = task.completed ? 'completed' : 'needsAction';

        // Add due date if available
        const dueDate = task.dueDate || task.dueTime;
        if (dueDate instanceof Date && !isNaN(dueDate.getTime())) {
            googleTaskData.due = formatDueDateTime(dueDate);
        }

        // Add notes with metadata
        const { notes, isOverLimit } = createTaskNotes(task);
        if (notes && !isOverLimit) {
            googleTaskData.notes = notes;
        } else if (task.description) {
            // Fallback: just save description
            googleTaskData.notes = task.description.substring(0, MAX_NOTES_LENGTH - 100);
        }

        // Clean up undefined values
        Object.keys(googleTaskData).forEach(key => {
            if (googleTaskData[key] === undefined || googleTaskData[key] === null) {
                delete googleTaskData[key];
            }
        });

        // Validate data
        const validation = validateTaskData(googleTaskData);
        if (!validation.isValid) {
            console.error('Task update validation failed:', validation.errors);
            throw new Error(`Invalid task data: ${validation.errors.join(', ')}`);
        }

        console.log('Updating task with data:', {
            id: taskId,
            title: googleTaskData.title,
            notesLength: googleTaskData.notes?.length || 0,
        });

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
            throw new Error(`Failed to update task: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Task updated successfully:', data.id);

        return {
            ...task,
            completed: data.status === 'completed'
        };
    } catch (error) {
        console.error('Error in updateGoogleTask:', error);
        throw error;
    }
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
        console.error('Delete task error response:', errorText);
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
    }

    console.log('Task deleted successfully:', taskId);
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
        console.error('Fetch task groups error:', errorText);
        throw new Error(`Failed to fetch task lists: ${response.status} ${response.statusText}`);
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

// Export helper function to calculate metadata size for UI
export function calculateTaskMetadataSize(task: Partial<Task>): {
    characterCount: number;
    isOverLimit: boolean;
    breakdown: {
        description: number;
        subtasks: number;
        attachments: number;
        tags: number;
        other: number;
    }
} {
    const { characterCount, isOverLimit } = createTaskNotes(task);

    // Calculate breakdown
    const description = (task.description || "").length;
    const subtasksSize = JSON.stringify(task.subtasks || []).length;
    const attachmentsSize = JSON.stringify(task.attachments || []).length;
    const tagsSize = JSON.stringify(task.tags || []).length;
    const other = Math.max(0, characterCount - description - subtasksSize - attachmentsSize - tagsSize);

    return {
        characterCount,
        isOverLimit,
        breakdown: {
            description,
            subtasks: subtasksSize,
            attachments: attachmentsSize,
            tags: tagsSize,
            other
        }
    };
}

// Export character limits for use in UI
export { MAX_NOTES_LENGTH, MAX_TITLE_LENGTH, setDefaultTaskTimes };