// src/utils/GGTask.ts - Fixed version with proper Google Tasks API handling

import type { Task } from "../presentation/types/task";

// Google Tasks API limits
const MAX_NOTES_LENGTH = 8192; // Google Tasks notes limit
const MAX_TITLE_LENGTH = 1024; // Google Tasks title limit

// Helper function to safely parse dates
function safeDateParse(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
        // Handle date-only format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Date(`${dateStr}T00:00:00.000Z`);
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

// Helper to create simplified task notes
function createTaskNotes(task: Partial<Task>): { notes: string; characterCount: number; isOverLimit: boolean } {
    try {
        // Build simplified metadata object
        const metadata: any = {
            // Core fields
            description: task.description || "",
            status: task.status || 'todo',
            priority: task.priority || 'medium',
        };

        // Add dates only if they exist and are valid
        if (task.startTime && task.startTime instanceof Date && !isNaN(task.startTime.getTime())) {
            metadata.startTime = task.startTime.toISOString();
        }
        if (task.endTime && task.endTime instanceof Date && !isNaN(task.endTime.getTime())) {
            metadata.endTime = task.endTime.toISOString();
        }
        if (task.startDate && task.startDate instanceof Date && !isNaN(task.startDate.getTime())) {
            metadata.startDate = task.startDate.toISOString();
        }
        if (task.endDate && task.endDate instanceof Date && !isNaN(task.endDate.getTime())) {
            metadata.endDate = task.endDate.toISOString();
        }

        // Add arrays with size limits
        if (task.subtasks && task.subtasks.length > 0) {
            metadata.subtasks = task.subtasks.slice(0, 10); // Limit to 10 subtasks
        }
        if (task.attachments && task.attachments.length > 0) {
            metadata.attachments = task.attachments.slice(0, 5); // Limit to 5 attachments
        }
        if (task.tags && task.tags.length > 0) {
            metadata.tags = task.tags.slice(0, 10); // Limit to 10 tags
        }

        // Include linking fields
        if (task.prevTaskId) metadata.prevTaskId = task.prevTaskId;
        if (task.nextTaskId) metadata.nextTaskId = task.nextTaskId;

        let jsonString = JSON.stringify(metadata);
        let characterCount = jsonString.length;
        let isOverLimit = characterCount > MAX_NOTES_LENGTH;

        console.log(`Metadata JSON length: ${characterCount}/${MAX_NOTES_LENGTH}`);

        // If over limit, progressively reduce size
        if (isOverLimit) {
            console.warn(`Metadata too large (${characterCount}/${MAX_NOTES_LENGTH}), reducing size...`);

            // Remove attachments first
            if (metadata.attachments) {
                delete metadata.attachments;
                jsonString = JSON.stringify(metadata);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by removing attachments');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Remove subtasks
            if (metadata.subtasks) {
                delete metadata.subtasks;
                jsonString = JSON.stringify(metadata);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by removing subtasks');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Truncate description
            if (metadata.description && metadata.description.length > 500) {
                metadata.description = metadata.description.substring(0, 500) + "...";
                jsonString = JSON.stringify(metadata);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by truncating description');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Last resort: minimal metadata
            if (isOverLimit) {
                console.warn('Using minimal metadata due to size constraints');
                const minimalMetadata = {
                    status: task.status || 'todo',
                    priority: task.priority || 'medium',
                    description: (task.description || "").substring(0, 100)
                };
                jsonString = JSON.stringify(minimalMetadata);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;
            }
        }

        return { notes: jsonString, characterCount, isOverLimit };
    } catch (error) {
        console.error('Error creating task notes:', error);
        // Return minimal safe metadata
        const safeMetadata = {
            description: task.description || "",
            status: task.status || 'todo',
            priority: task.priority || 'medium'
        };
        const jsonString = JSON.stringify(safeMetadata);
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
        // Google Tasks API expects RFC 3339 format with timezone
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

// Auto-set default dates and times for new tasks
function setDefaultTaskTimes(): { startTime: Date; endTime: Date; startDate: Date; endDate: Date } {
    const now = new Date();

    // Set start time to current time (rounded to next 15-minute interval)
    const startTime = new Date(now);
    const minutes = startTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    startTime.setMinutes(roundedMinutes, 0, 0);

    // Set end time to 1 hour after start time
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // Set start date to today (beginning of day)
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    // Set end date to today (end of day)
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return { startTime, endTime, startDate, endDate };
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
            priority: taskData.priority || 'medium',
            startTime: taskData.startTime ? safeDateParse(taskData.startTime) : null,
            endTime: taskData.endTime ? safeDateParse(taskData.endTime) : null,
            startDate: taskData.startDate ? safeDateParse(taskData.startDate) : null,
            endDate: taskData.endDate ? safeDateParse(taskData.endDate) : null,
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
    try {
        console.log('Creating task with input:', {
            title: task.title,
            status: task.status,
            priority: task.priority,
        });

        // Auto-set default times if not provided
        let taskWithDefaults = { ...task };
        if (!task.startTime && !task.endTime && !task.startDate && !task.endDate) {
            const defaultTimes = setDefaultTaskTimes();
            taskWithDefaults = {
                ...task,
                ...defaultTimes
            };
            console.log('Auto-set default times:', defaultTimes);
        }

        // Prepare minimal task data for Google Tasks API
        const googleTaskData: any = {
            title: (taskWithDefaults.title || "New Task").trim().substring(0, MAX_TITLE_LENGTH)
        };

        // Set status (Google Tasks only supports 'needsAction' and 'completed')
        googleTaskData.status = taskWithDefaults.completed ? 'completed' : 'needsAction';

        // Add due date if available (use endDate or endTime)
        const dueDate = taskWithDefaults.endDate || taskWithDefaults.endTime;
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

            // Try to parse error details
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

        // Return the task with all original data preserved
        return {
            id: data.id,
            title: data.title || taskWithDefaults.title || "New Task",
            description: taskWithDefaults.description || "",
            status: taskWithDefaults.status || 'todo',
            priority: taskWithDefaults.priority || 'medium',
            startTime: taskWithDefaults.startTime || null,
            endTime: taskWithDefaults.endTime || null,
            startDate: taskWithDefaults.startDate || null,
            endDate: taskWithDefaults.endDate || null,
            completed: data.status === 'completed',
            subtasks: taskWithDefaults.subtasks || [],
            attachments: taskWithDefaults.attachments || [],
            tags: taskWithDefaults.tags || [],
            activityLog: taskWithDefaults.activityLog || [],
            prevTaskId: taskWithDefaults.prevTaskId || null,
            nextTaskId: taskWithDefaults.nextTaskId || null,
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
        const dueDate = task.endDate || task.endTime;
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