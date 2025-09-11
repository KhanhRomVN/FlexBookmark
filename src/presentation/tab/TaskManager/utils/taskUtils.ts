import type { Task, Status } from '../types/task';

export const determineTaskStatus = (task: Task): Status => {
    const now = new Date();
    if (task.completed) return "done";
    if (!task.startDate && !task.startTime) return "backlog";

    let startDateTime: Date | null = null;
    let dueDateTime: Date | null = null;

    if (task.startDate && task.startTime) {
        startDateTime = new Date(
            task.startDate.getFullYear(),
            task.startDate.getMonth(),
            task.startDate.getDate(),
            task.startTime.getHours(),
            task.startTime.getMinutes(),
            task.startTime.getSeconds()
        );
    } else if (task.startDate) {
        startDateTime = new Date(task.startDate);
    } else if (task.startTime) {
        const today = new Date();
        startDateTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            task.startTime.getHours(),
            task.startTime.getMinutes(),
            task.startTime.getSeconds()
        );
    }

    if (task.dueDate && task.dueTime) {
        dueDateTime = new Date(
            task.dueDate.getFullYear(),
            task.dueDate.getMonth(),
            task.dueDate.getDate(),
            task.dueTime.getHours(),
            task.dueTime.getMinutes(),
            task.dueTime.getSeconds()
        );
    } else if (task.dueDate) {
        dueDateTime = new Date(task.dueDate);
    } else if (task.dueTime) {
        const today = new Date();
        dueDateTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            task.dueTime.getHours(),
            task.dueTime.getMinutes(),
            task.dueTime.getSeconds()
        );
    }

    if (dueDateTime && now > dueDateTime) return "overdue";
    if (startDateTime && now < startDateTime) return "todo";
    if (startDateTime && now >= startDateTime) return "in-progress";

    return task.status || "backlog";
};

export const addActivityLogEntry = (
    task: Task,
    action: string,
    details: string,
    userId: string = "user"
): Task => {
    const now = new Date();
    const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details,
        action,
        userId,
        timestamp: now
    };

    const activityLog = [...(task.activityLog || []), activityEntry];
    if (activityLog.length > 50) {
        activityLog.splice(0, activityLog.length - 50);
    }

    return {
        ...task,
        activityLog
    };
};

export const createInitialActivityLog = (): any[] => {
    const now = new Date();
    return [{
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details: `Task created at ${now.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`,
        action: "created",
        userId: "user",
        timestamp: now
    }];
};

export const checkAndMoveOverdueTasks = (tasks: Task[]): Task[] => {
    const folders = [
        { id: "backlog", title: "Backlog", emoji: "📥", priority: 1 },
        { id: "todo", title: "To Do", emoji: "📋", priority: 2 },
        { id: "in-progress", title: "In Progress", emoji: "🚧", priority: 3 },
        { id: "overdue", title: "Overdue", emoji: "⏰", priority: 4 },
        { id: "done", title: "Done", emoji: "✅", priority: 0 },
        { id: "archive", title: "Archive", emoji: "🗄️", priority: -1 },
    ];

    const BATCH_SIZE = 50;
    const batchedTasks = [];

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        const batch = tasks.slice(i, i + BATCH_SIZE);
        const processedBatch = batch.map(task => {
            const newStatus = determineTaskStatus(task);
            if (newStatus !== task.status && task.status !== "done") {
                return addActivityLogEntry(
                    { ...task, status: newStatus },
                    "status_changed",
                    `Status automatically changed from "${folders.find(f => f.id === task.status)?.title}" to "${folders.find(f => f.id === newStatus)?.title}" based on timing`
                );
            }
            return task;
        });
        batchedTasks.push(...processedBatch);
    }

    return batchedTasks;
};

export const safeStringify = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return String(value);
};

export const safeStringMatch = (text: string, searchTerm: string): boolean => {
    try {
        const safeText = safeStringify(text).toLowerCase();
        const safeTerm = safeStringify(searchTerm).toLowerCase();
        return safeText.includes(safeTerm);
    } catch (error) {
        console.warn('Error in string matching:', error);
        return false;
    }
};

export const getTaskDates = (task: Task): Date[] => {
    const dates: Date[] = [];

    // Kiểm tra từng field cụ thể thay vì dùng vòng lặp
    const checkAndAddDate = (value: any): void => {
        if (value && (typeof value === 'string' || typeof value === 'number' || value instanceof Date)) {
            try {
                const parsedDate = new Date(value);
                if (!isNaN(parsedDate.getTime())) {
                    dates.push(parsedDate);
                }
            } catch (error) {
                console.warn('Invalid date value:', value, error);
            }
        }
    };

    // Kiểm tra các date fields
    checkAndAddDate(task.startDate);
    checkAndAddDate(task.startTime);
    checkAndAddDate(task.dueDate);
    checkAndAddDate(task.dueTime);
    checkAndAddDate(task.actualStartDate);
    checkAndAddDate(task.actualStartTime);
    checkAndAddDate(task.actualEndDate);
    checkAndAddDate(task.actualEndTime);
    checkAndAddDate(task.createdAt);
    checkAndAddDate(task.updatedAt);

    return dates;
};