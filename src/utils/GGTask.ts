// src/utils/GGTask.ts - Fixed version with proper Google Tasks API handling

import type { Task } from "../presentation/types/task";

// Export helper function to calculate metadata size for UI
export function calculateTaskMetadataSize(task: Partial<Task>): {
    characterCount: number;
    isOverLimit: boolean;
    breakdown: {
        description: number;
        subtasks: number;
        attachments: number;
        tags: number;
        activityLog: number;
        dates: number;
        other: number;
    }
} {
    const { characterCount, isOverLimit } = createTaskNotes(task);

    // Calculate breakdown
    const description = (task.description || "").length;
    const subtasksSize = JSON.stringify(task.subtasks || []).length;
    const attachmentsSize = JSON.stringify(task.attachments || []).length;
    const tagsSize = JSON.stringify(task.tags || []).length;
    const activityLogSize = JSON.stringify(task.activityLog || []).length;

    let datesSize = 0;
    if (task.startTime) datesSize += 25;
    if (task.endTime) datesSize += 25;
    if (task.startDate) datesSize += 25;
    if (task.endDate) datesSize += 25;

    const other = Math.max(0, characterCount - description - subtasksSize - attachmentsSize - tagsSize - activityLogSize - datesSize);

    return {
        characterCount,
        isOverLimit,
        breakdown: {
            description,
            subtasks: subtasksSize,
            attachments: attachmentsSize,
            tags: tagsSize,
            activityLog: activityLogSize,
            dates: datesSize,
            other
        }
    };
}

// Google Tasks API limits
const MAX_NOTES_LENGTH = 4095; // Actual Google Tasks API limit
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

// Helper to create task notes with proper length checking
function createTaskNotes(task: Partial<Task>): { notes: string; characterCount: number; isOverLimit: boolean } {
    try {
        // Build metadata object with proper checks
        const metadata: any = {};

        // Always include description (even if empty for consistency)
        metadata.description = task.description || "";

        // Always include status and priority for proper task management
        metadata.status = task.status || 'todo';
        metadata.priority = task.priority || 'medium';

        // Handle dates properly - check for valid Date objects
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

        // Include arrays with size limits to prevent overflow
        const maxArrayItems = 50; // Reasonable limit for each array
        metadata.subtasks = (task.subtasks || []).slice(0, maxArrayItems);
        metadata.attachments = (task.attachments || []).slice(0, maxArrayItems);
        metadata.tags = (task.tags || []).slice(0, maxArrayItems);
        metadata.activityLog = (task.activityLog || []).slice(0, maxArrayItems);

        // Include linking fields
        metadata.prevTaskId = task.prevTaskId || null;
        metadata.nextTaskId = task.nextTaskId || null;

        let jsonString = JSON.stringify(metadata);
        let characterCount = jsonString.length;
        let isOverLimit = characterCount > MAX_NOTES_LENGTH;

        console.log('Created metadata:', metadata);
        console.log(`Metadata JSON length: ${characterCount}/${MAX_NOTES_LENGTH}`);

        // If over limit, create progressively smaller versions
        if (isOverLimit) {
            console.warn(`Metadata too large (${characterCount}/${MAX_NOTES_LENGTH}), reducing size...`);

            // Try removing activity log first
            if (metadata.activityLog && metadata.activityLog.length > 0) {
                metadata.activityLog = [];
                jsonString = JSON.stringify(metadata);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by removing activity log');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Try reducing subtasks
            if (metadata.subtasks && metadata.subtasks.length > 10) {
                metadata.subtasks = metadata.subtasks.slice(0, 10);
                jsonString = JSON.stringify(metadata);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by limiting subtasks');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Try reducing attachments
            if (metadata.attachments && metadata.attachments.length > 5) {
                metadata.attachments = metadata.attachments.slice(0, 5);
                jsonString = JSON.stringify(metadata);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;

                if (!isOverLimit) {
                    console.log('Reduced size by limiting attachments');
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Try truncating description
            if (metadata.description && metadata.description.length > 100) {
                metadata.description = metadata.description.substring(0, 100) + "...";
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
                    description: (task.description || "").substring(0, 100),
                    status: task.status || 'todo',
                    priority: task.priority || 'medium',
                    subtasks: [],
                    attachments: [],
                    tags: (task.tags || []).slice(0, 5),
                    activityLog: [],
                    prevTaskId: null,
                    nextTaskId: null
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
            priority: task.priority || 'medium',
            subtasks: [],
            attachments: [],
            tags: [],
            activityLog: [],
            prevTaskId: null,
            nextTaskId: null
        };
        const jsonString = JSON.stringify(safeMetadata);
        return {
            notes: jsonString,
            characterCount: jsonString.length,
            isOverLimit: jsonString.length > MAX_NOTES_LENGTH
        };
    }
}

// Helper to format due date for Google Tasks API (RFC 3339 date format)
function formatDueDate(date: Date | null | undefined): string | undefined {
    if (!date) return undefined;

    try {
        // Google Tasks API expects RFC 3339 date format (YYYY-MM-DD)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting due date:', error);
        return undefined;
    }
}

// Helper to validate task data before sending to API
function validateTaskData(taskData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check title length
    if (!taskData.title || taskData.title.trim() === "") {
        errors.push("Title is required");
    } else if (taskData.title.length > MAX_TITLE_LENGTH) {
        errors.push(`Title too long (${taskData.title.length}/${MAX_TITLE_LENGTH})`);
    }

    // Check notes length
    if (taskData.notes && taskData.notes.length > MAX_NOTES_LENGTH) {
        errors.push(`Notes too long (${taskData.notes.length}/${MAX_NOTES_LENGTH})`);
    }

    // Validate due date format
    if (taskData.due && !/^\d{4}-\d{2}-\d{2}$/.test(taskData.due)) {
        errors.push("Invalid due date format");
    }

    // Validate status
    if (taskData.status && !['needsAction', 'completed'].includes(taskData.status)) {
        errors.push("Invalid status");
    }

    return { isValid: errors.length === 0, errors };
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
            title: item.title || "No title",
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
        console.log('Input task data:', {
            title: task.title,
            titleLength: task.title?.length || 0,
            status: task.status,
            priority: task.priority,
            hasDescription: !!(task.description),
            descriptionLength: task.description?.length || 0,
            hasSubtasks: !!(task.subtasks && task.subtasks.length > 0),
            hasAttachments: !!(task.attachments && task.attachments.length > 0),
        });

        // Prepare the task data for Google Tasks API with minimal required fields
        const googleTaskData: any = {
            title: (task.title || "New Task").substring(0, MAX_TITLE_LENGTH) // Ensure title is within limits
        };

        // Create notes with all metadata and get character count info
        const { notes, characterCount, isOverLimit } = createTaskNotes(task);

        if (notes && notes.trim() && notes !== '""' && !isOverLimit) {
            googleTaskData.notes = notes;
        } else if (isOverLimit) {
            console.warn('Notes exceeded limit, saving without extended metadata');
            // Just save basic description if it exists
            if (task.description && task.description.trim()) {
                googleTaskData.notes = task.description.substring(0, MAX_NOTES_LENGTH - 100); // Leave some buffer
            }
        }

        // Add due date if provided and valid
        if (task.endDate || task.endTime) {
            const dateForDue = task.endDate || task.endTime;
            if (dateForDue instanceof Date && !isNaN(dateForDue.getTime())) {
                const dueDate = formatDueDate(dateForDue);
                if (dueDate) {
                    googleTaskData.due = dueDate;
                }
            }
        }

        // Set status - only use basic Google Tasks statuses
        googleTaskData.status = task.completed ? 'completed' : 'needsAction';

        // Validate data before sending
        const validation = validateTaskData(googleTaskData);
        if (!validation.isValid) {
            console.error('Task data validation failed:', validation.errors);
            throw new Error(`Invalid task data: ${validation.errors.join(', ')}`);
        }

        // Clean up any undefined values
        Object.keys(googleTaskData).forEach(key => {
            if (googleTaskData[key] === undefined || googleTaskData[key] === null) {
                delete googleTaskData[key];
            }
        });

        console.log('Sending to Google Tasks API:', {
            ...googleTaskData,
            notesLength: googleTaskData.notes?.length || 0,
            characterCount
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

            // Parse error details if available
            try {
                const errorData = JSON.parse(errorText);
                console.error('Detailed error:', errorData);
            } catch (e) {
                console.error('Could not parse error response');
            }

            throw new Error(`Failed to create task: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Task created successfully:', data);

        // Return the task with all original data preserved
        return {
            id: data.id,
            title: data.title || task.title || "New Task",
            description: task.description || "",
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            startTime: task.startTime || null,
            endTime: task.endTime || null,
            startDate: task.startDate || null,
            endDate: task.endDate || null,
            completed: data.status === 'completed',
            subtasks: task.subtasks || [],
            attachments: task.attachments || [],
            tags: task.tags || [],
            activityLog: task.activityLog || [],
            prevTaskId: task.prevTaskId || null,
            nextTaskId: task.nextTaskId || null,
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
        // Prepare the task data for Google Tasks API
        const googleTaskData: any = {
            id: taskId,
            title: (task.title || "Updated Task").substring(0, MAX_TITLE_LENGTH)
        };

        // Add notes with simplified metadata
        const { notes, characterCount, isOverLimit } = createTaskNotes(task);

        if (notes && notes.trim() && notes !== '""' && !isOverLimit) {
            googleTaskData.notes = notes;
        } else if (isOverLimit) {
            console.warn('Notes exceeded limit during update, using truncated version');
            if (task.description && task.description.trim()) {
                googleTaskData.notes = task.description.substring(0, MAX_NOTES_LENGTH - 100);
            }
        }

        // Add due date if provided
        if (task.endDate || task.endTime) {
            const dueDate = formatDueDate(task.endDate || task.endTime);
            if (dueDate) {
                googleTaskData.due = dueDate;
            }
        }

        // Set status
        googleTaskData.status = task.completed ? 'completed' : 'needsAction';

        // Validate data
        const validation = validateTaskData(googleTaskData);
        if (!validation.isValid) {
            console.error('Task update validation failed:', validation.errors);
            throw new Error(`Invalid task data: ${validation.errors.join(', ')}`);
        }

        // Clean up undefined values
        Object.keys(googleTaskData).forEach(key => {
            if (googleTaskData[key] === undefined || googleTaskData[key] === null) {
                delete googleTaskData[key];
            }
        });

        console.log('Updating task with data:', {
            ...googleTaskData,
            notesLength: googleTaskData.notes?.length || 0,
            characterCount
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
            throw new Error(`Failed to update task: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Task updated successfully:', data);

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

// Export character limits for use in UI
export { MAX_NOTES_LENGTH, MAX_TITLE_LENGTH };