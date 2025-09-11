import type { Task } from "../types/task";

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

// Simplified authenticated request - no token refresh logic here
async function makeAuthenticatedRequest(
    url: string,
    token: string,
    options: RequestInit = {}
): Promise<Response> {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
}

// Create a new Google Tasks list (task group)
export async function createGoogleTaskList(
    accessToken: string,
    listTitle: string
): Promise<{ id: string; title: string }> {
    try {
        const taskListData = {
            title: listTitle.trim()
        };

        // Validate data
        if (!taskListData.title) {
            throw new Error('Task list title is required');
        }

        if (taskListData.title.length > 1024) {
            throw new Error('Task list title too long (max 1024 characters)');
        }

        const response = await makeAuthenticatedRequest(
            'https://www.googleapis.com/tasks/v1/users/@me/lists',
            accessToken,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskListData),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create task list error response:', errorText);

            try {
                const errorData = JSON.parse(errorText);
                console.error('Detailed error:', errorData);

                if (errorData.error?.message) {
                    throw new Error(`Google Tasks API Error: ${errorData.error.message}`);
                }
            } catch (parseError) {
                // If we can't parse the error, just throw the original
            }

            throw new Error(`Failed to create task list: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
            id: data.id,
            title: data.title
        };
    } catch (error) {
        console.error('Error in createGoogleTaskList:', error);
        throw error;
    }
}

// Fetch all Google Tasks lists (task groups)
export async function fetchGoogleTaskLists(accessToken: string) {
    try {
        const response = await makeAuthenticatedRequest(
            "https://www.googleapis.com/tasks/v1/users/@me/lists",
            accessToken
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fetch task lists error:', errorText);
            throw new Error(`Failed to fetch task lists: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            selfLink: item.selfLink,
            updated: item.updated
        }));
    } catch (error) {
        console.error('Error in fetchGoogleTaskLists:', error);
        throw error;
    }
}

// Helper to create simplified task notes with full format
function createTaskNotes(task: Partial<Task>): { notes: string; characterCount: number; isOverLimit: boolean } {
    try {
        // Build complete metadata object with consistent formatting
        const metadata: any = {
            // Core fields
            description: task.description || "",
            status: task.status || "backlog",
            priority: task.priority || "",
            collection: task.collection || "",

            // Location fields
            locationName: task.locationName || "",
            locationAddress: task.locationAddress || "",
            locationCoordinates: task.locationCoordinates || "",
        };

        // Format time and date consistently - only when values exist
        if (task.startTime && task.startTime instanceof Date && !isNaN(task.startTime.getTime())) {
            const timeStr = task.startTime.toISOString().split("T")[1];
            metadata.startTime = timeStr;
        } else {
            metadata.startTime = "";
        }

        if (task.dueTime && task.dueTime instanceof Date && !isNaN(task.dueTime.getTime())) {
            const timeStr = task.dueTime.toISOString().split("T")[1];
            metadata.dueTime = timeStr;
        } else {
            metadata.dueTime = "";
        }

        if (task.startDate && task.startDate instanceof Date && !isNaN(task.startDate.getTime())) {
            metadata.startDate = task.startDate.toISOString().split("T")[0];
        } else {
            metadata.startDate = "";
        }

        if (task.dueDate && task.dueDate instanceof Date && !isNaN(task.dueDate.getTime())) {
            metadata.dueDate = task.dueDate.toISOString().split("T")[0];
        } else {
            metadata.dueDate = "";
        }

        // Add actual start/end date/time fields
        if (task.actualStartTime && task.actualStartTime instanceof Date && !isNaN(task.actualStartTime.getTime())) {
            const timeStr = task.actualStartTime.toISOString().split("T")[1];
            metadata.actualStartTime = timeStr;
        } else {
            metadata.actualStartTime = "";
        }

        if (task.actualEndTime && task.actualEndTime instanceof Date && !isNaN(task.actualEndTime.getTime())) {
            const timeStr = task.actualEndTime.toISOString().split("T")[1];
            metadata.actualEndTime = timeStr;
        } else {
            metadata.actualEndTime = "";
        }

        if (task.actualStartDate && task.actualStartDate instanceof Date && !isNaN(task.actualStartDate.getTime())) {
            metadata.actualStartDate = task.actualStartDate.toISOString().split("T")[0];
        } else {
            metadata.actualStartDate = "";
        }

        if (task.actualEndDate && task.actualEndDate instanceof Date && !isNaN(task.actualEndDate.getTime())) {
            metadata.actualEndDate = task.actualEndDate.toISOString().split("T")[0];
        } else {
            metadata.actualEndDate = "";
        }

        // Always include arrays (empty if none)
        metadata.subtasks = task.subtasks || [];
        metadata.attachments = task.attachments || [];
        metadata.tags = task.tags || [];

        // Activity log
        let activityLog = task.activityLog || [];

        // If new task (no activity log and no id) then create "created" entry
        if (activityLog.length === 0 && !task.id) {
            const now = new Date();
            const entryId = `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`;
            const creationEntry = {
                id: entryId,
                details: `Task created at ${now.toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                })}`,
                action: "created",
                userId: "system",
                timestamp: now,
            };
            activityLog = [creationEntry];
        }
        metadata.activityLog = activityLog;

        // Serialize JSON
        let jsonString = JSON.stringify(metadata, null, 0);
        let characterCount = jsonString.length;
        let isOverLimit = characterCount > MAX_NOTES_LENGTH;

        // If over limit -> optimize to reduce size
        if (isOverLimit) {
            console.warn(`Metadata too large (${characterCount}/${MAX_NOTES_LENGTH}), reducing size...`);

            // Limit activity log
            if (metadata.activityLog && metadata.activityLog.length > 5) {
                metadata.activityLog = metadata.activityLog.slice(-5);
                jsonString = JSON.stringify(metadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;
                if (!isOverLimit) {
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Remove attachments
            if (metadata.attachments && metadata.attachments.length > 0) {
                metadata.attachments = [];
                jsonString = JSON.stringify(metadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;
                if (!isOverLimit) {
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
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Truncate location fields if needed
            if (metadata.locationAddress && metadata.locationAddress.length > 200) {
                metadata.locationAddress = metadata.locationAddress.substring(0, 200) + "...";
                jsonString = JSON.stringify(metadata, null, 0);
                characterCount = jsonString.length;
                isOverLimit = characterCount > MAX_NOTES_LENGTH;
                if (!isOverLimit) {
                    return { notes: jsonString, characterCount, isOverLimit: false };
                }
            }

            // Final solution: keep minimal metadata
            if (isOverLimit) {
                console.warn("Using minimal metadata due to size constraints");
                const minimalMetadata = {
                    description: (metadata.description || "").substring(0, 100),
                    status: metadata.status,
                    priority: metadata.priority,
                    collection: metadata.collection,
                    locationName: metadata.locationName || "",
                    locationAddress: "",  // Clear long address
                    locationCoordinates: metadata.locationCoordinates || "",
                    startTime: metadata.startTime,
                    dueTime: metadata.dueTime,
                    startDate: metadata.startDate,
                    dueDate: metadata.dueDate,
                    // Keep actual times even in minimal metadata
                    actualStartTime: metadata.actualStartTime,
                    actualEndTime: metadata.actualEndTime,
                    actualStartDate: metadata.actualStartDate,
                    actualEndDate: metadata.actualEndDate,
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
        console.error("Error creating task notes:", error);
        // Safe fallback metadata
        const safeMetadata = {
            description: task.description || "",
            status: task.status || "backlog",
            priority: task.priority || "",
            collection: task.collection || "",
            locationName: task.locationName || "",
            locationAddress: task.locationAddress || "",
            locationCoordinates: task.locationCoordinates || "",
            startTime: "",
            dueTime: "",
            startDate: "",
            dueDate: "",
            actualStartTime: task.actualStartTime ?
                task.actualStartTime.toISOString().split("T")[1] : "",
            actualEndTime: task.actualEndTime ?
                task.actualEndTime.toISOString().split("T")[1] : "",
            actualStartDate: task.actualStartDate ?
                task.actualStartDate.toISOString().split("T")[0] : "",
            actualEndDate: task.actualEndDate ?
                task.actualEndDate.toISOString().split("T")[0] : "",
            subtasks: [],
            attachments: [],
            tags: [],
            activityLog: [
                {
                    id: `${new Date().getTime()}-${Math.random().toString(36).substring(2, 8)}`,
                    details: `Task created at ${new Date().toLocaleString()}`,
                    action: "created",
                    userId: "system",
                    timestamp: new Date(),
                },
            ],
        };
        const jsonString = JSON.stringify(safeMetadata, null, 0);
        return {
            notes: jsonString,
            characterCount: jsonString.length,
            isOverLimit: jsonString.length > MAX_NOTES_LENGTH,
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

// Update a Google Tasks list
export async function updateGoogleTaskList(
    accessToken: string,
    listId: string,
    listTitle: string
): Promise<{ id: string; title: string }> {
    try {
        const taskListData = {
            id: listId,
            title: listTitle.trim()
        };

        // Validate data
        if (!taskListData.title) {
            throw new Error('Task list title is required');
        }

        if (taskListData.title.length > 1024) {
            throw new Error('Task list title too long (max 1024 characters)');
        }

        const response = await makeAuthenticatedRequest(
            `https://www.googleapis.com/tasks/v1/users/@me/lists/${listId}`,
            accessToken,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskListData),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Update task list error response:', errorText);
            throw new Error(`Failed to update task list: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
            id: data.id,
            title: data.title
        };
    } catch (error) {
        console.error('Error in updateGoogleTaskList:', error);
        throw error;
    }
}

// Delete a Google Tasks list
export async function deleteGoogleTaskList(
    accessToken: string,
    listId: string
): Promise<void> {
    try {
        const response = await makeAuthenticatedRequest(
            `https://www.googleapis.com/tasks/v1/users/@me/lists/${listId}`,
            accessToken,
            {
                method: 'DELETE',
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete task list error response:', errorText);
            throw new Error(`Failed to delete task list: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error in deleteGoogleTaskList:', error);
        throw error;
    }
}

export async function fetchGoogleTasks(token: string, tasklistId: string = '@default') {
    const response = await makeAuthenticatedRequest(
        `https://www.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=true&showHidden=true`,
        token
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
            // If notes is not JSON -> treat as description
            taskData.description = item.notes || "";
        }

        const task: Task = {
            id: item.id,
            title: item.title || "Untitled Task",
            description: taskData.description || "",
            status: taskData.status || (item.status === "completed" ? "done" : "todo"),
            priority: taskData.priority || "medium", // Default priority
            collection: taskData.collection || "",

            // Parse individual location fields from metadata
            locationName: taskData.locationName || "",
            locationAddress: taskData.locationAddress || "",
            locationCoordinates: taskData.locationCoordinates || "",

            // Parse planned date/time fields
            startTime: taskData.startTime ? safeDateParse(taskData.startTime) : null,
            dueTime: taskData.dueTime ? safeDateParse(taskData.dueTime) : null,
            startDate: taskData.startDate ? safeDateParse(taskData.startDate) : null,
            dueDate: taskData.dueDate ? safeDateParse(taskData.dueDate) : null,

            // Parse actual start/end date/time fields
            actualStartTime: taskData.actualStartTime ? safeDateParse(taskData.actualStartTime) : null,
            actualEndTime: taskData.actualEndTime ? safeDateParse(taskData.actualEndTime) : null,
            actualStartDate: taskData.actualStartDate ? safeDateParse(taskData.actualStartDate) : null,
            actualEndDate: taskData.actualEndDate ? safeDateParse(taskData.actualEndDate) : null,

            completed: item.status === "completed",
            subtasks: taskData.subtasks || [],
            attachments: taskData.attachments || [],
            tags: taskData.tags || [],
            activityLog: taskData.activityLog || [],
            updatedAt: item.updated || "",
            createdAt: item.updated || "",
            linkedTasks: taskData.linkedTasks || []
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
        // Don't auto-set default times - only use what user inputs
        const taskWithDefaults = { ...task };

        // Prepare minimal task data for Google Tasks API
        const googleTaskData: any = {
            title: (taskWithDefaults.title || "New Task").trim().substring(0, MAX_TITLE_LENGTH)
        };

        // Set status (Google Tasks only supports 'needsAction' and 'completed')
        googleTaskData.status = taskWithDefaults.completed ? 'completed' : 'needsAction';

        // Add due date ONLY WHEN AVAILABLE (use dueDate or dueTime)
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

        const response = await makeAuthenticatedRequest(
            `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
            accessToken,
            {
                method: 'POST',
                headers: {
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

        // Return the task with only what user input - DON'T add default times
        return {
            id: data.id,
            title: data.title || taskWithDefaults.title || "New Task",
            description: taskWithDefaults.description || "",
            status: taskWithDefaults.status || 'todo',
            priority: taskWithDefaults.priority || 'medium',
            collection: taskWithDefaults.collection || "",

            locationName: taskWithDefaults.locationName || "",
            locationAddress: taskWithDefaults.locationAddress || "",
            locationCoordinates: taskWithDefaults.locationCoordinates || "",

            startTime: taskWithDefaults.startTime || null,
            dueTime: taskWithDefaults.dueTime || null,
            startDate: taskWithDefaults.startDate || null,
            dueDate: taskWithDefaults.dueDate || null,

            // Add actual start/end fields if needed
            actualStartTime: taskWithDefaults.actualStartTime || null,
            actualEndTime: taskWithDefaults.actualEndTime || null,
            actualStartDate: taskWithDefaults.actualStartDate || null,
            actualEndDate: taskWithDefaults.actualEndDate || null,

            completed: data.status === 'completed',
            subtasks: taskWithDefaults.subtasks || [],
            attachments: taskWithDefaults.attachments || [],
            tags: taskWithDefaults.tags || [],
            activityLog: taskWithDefaults.activityLog || [],
            createdAt: data.updated || new Date().toISOString(),
            updatedAt: data.updated || new Date().toISOString(),
            linkedTasks: taskWithDefaults.linkedTasks || []
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

        const response = await makeAuthenticatedRequest(
            `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
            accessToken,
            {
                method: 'PATCH',
                headers: {
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
    taskListId: string = '@default'
): Promise<void> => {
    const response = await makeAuthenticatedRequest(
        `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
        accessToken,
        {
            method: 'DELETE',
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete task error response:', errorText);
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
    }
};

export async function fetchGoogleTaskGroups(accessToken: string) {
    const response = await makeAuthenticatedRequest(
        "https://www.googleapis.com/tasks/v1/users/@me/lists",
        accessToken
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch task groups error:', errorText);
        throw new Error(`Failed to fetch task lists: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
}

export function calculateTaskMetadataSize(task: Partial<Task>): {
    characterCount: number;
    isOverLimit: boolean;
    breakdown: {
        description: number;
        activityLog: number;
        subtasks: number;
        attachments: number;
        tags: number;
        other: number;
    };
} {
    try {
        // Use the same logic as createTaskNotes to get consistent sizing
        const { characterCount, isOverLimit } = createTaskNotes(task);

        // Calculate breakdown of different components
        const breakdown = {
            description: (task.description || "").length,
            activityLog: JSON.stringify(task.activityLog || []).length,
            subtasks: JSON.stringify(task.subtasks || []).length,
            attachments: JSON.stringify(task.attachments || []).length,
            tags: JSON.stringify(task.tags || []).length,
            other: 0
        };

        // Calculate "other" as the remainder
        const knownSize = Object.values(breakdown).reduce((sum, size) => sum + size, 0) - breakdown.other;
        breakdown.other = Math.max(0, characterCount - knownSize);

        return {
            characterCount,
            isOverLimit,
            breakdown
        };
    } catch (error) {
        console.error('Error calculating task metadata size:', error);
        return {
            characterCount: 0,
            isOverLimit: false,
            breakdown: {
                description: 0,
                activityLog: 0,
                subtasks: 0,
                attachments: 0,
                tags: 0,
                other: 0
            }
        };
    }
}

// Export character limits for use in UI
export { MAX_NOTES_LENGTH, MAX_TITLE_LENGTH };