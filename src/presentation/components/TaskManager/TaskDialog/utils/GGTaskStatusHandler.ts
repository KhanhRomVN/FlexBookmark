import type { Task, Status } from '../../../../types/task';

/**
 * Enhanced status handling for Google Tasks limitations
 */
export class GoogleTasksStatusHandler {

    /**
     * Check if a status transition is allowed by Google Tasks API
     */
    static isTransitionAllowed(fromStatus: Status, toStatus: Status): boolean {
        // Google Tasks doesn't allow easy restoration from completed state
        if (fromStatus === 'done' && toStatus !== 'done') {
            return false;
        }
        return true;
    }

    /**
     * Handle status transition with Google Tasks limitations
     */
    static async handleStatusTransition(
        task: Task,
        newStatus: Status,
        updateFunction: (task: Task) => Promise<Task>
    ): Promise<{ success: boolean; task?: Task; error?: string }> {

        // Check if transition is allowed
        if (!this.isTransitionAllowed(task.status, newStatus)) {
            return {
                success: false,
                error: `Cannot move task from "${task.status}" to "${newStatus}". Google Tasks doesn't support restoring completed tasks.`
            };
        }

        try {
            const updatedTask = await updateFunction({
                ...task,
                status: newStatus,
                completed: newStatus === 'done'
            });

            return { success: true, task: updatedTask };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update task status'
            };
        }
    }

    /**
     * Alternative solution: Create a new task instead of restoring
     */
    static async createTaskFromCompleted(
        completedTask: Task,
        newStatus: Status,
        createFunction: (task: Partial<Task>) => Promise<Task>,
        deleteFunction: (taskId: string) => Promise<void>
    ): Promise<{ success: boolean; task?: Task; error?: string }> {

        if (completedTask.status !== 'done') {
            return {
                success: false,
                error: 'This method is only for completed tasks'
            };
        }

        try {
            // Create new task with same content but different status
            const newTask = await createFunction({
                title: completedTask.title + ' (Restored)',
                description: completedTask.description,
                status: newStatus,
                priority: completedTask.priority,
                startTime: completedTask.startTime,
                dueTime: completedTask.dueTime,
                startDate: completedTask.startDate,
                dueDate: completedTask.dueDate,
                completed: false,
                subtasks: completedTask.subtasks,
                attachments: completedTask.attachments,
                tags: [...(completedTask.tags || []), 'restored'],
                activityLog: [
                    ...(completedTask.activityLog || []),
                    {
                        id: `restore_${Date.now()}`,
                        action: 'restored',
                        details: `Task restored from completed state to ${newStatus}`,
                        userId: 'user',
                        timestamp: new Date()
                    }
                ]
            });

            // Optionally delete the old completed task
            // await deleteFunction(completedTask.id);

            return { success: true, task: newTask };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create restored task'
            };
        }
    }
}

// Enhanced status transition utilities
export const handleGoogleTasksStatusChange = async (
    task: Task,
    newStatus: Status,
    operations: {
        update: (task: Task) => Promise<Task>;
        create: (task: Partial<Task>) => Promise<Task>;
        delete: (taskId: string) => Promise<void>;
    }
): Promise<{ success: boolean; task?: Task; error?: string; requiresConfirmation?: boolean }> => {

    // Direct transition - try first
    if (GoogleTasksStatusHandler.isTransitionAllowed(task.status, newStatus)) {
        return GoogleTasksStatusHandler.handleStatusTransition(task, newStatus, operations.update);
    }

    // Special case: trying to restore from completed
    if (task.status === 'done' && newStatus !== 'done') {
        return {
            success: false,
            requiresConfirmation: true,
            error: 'Google Tasks doesn\'t support restoring completed tasks. Would you like to create a new task instead?'
        };
    }

    return {
        success: false,
        error: `Status transition from "${task.status}" to "${newStatus}" is not supported`
    };
};

// Add to your TaskDialog status change handler
export const enhancedHandleStatusChange = async (
    task: Task,
    newStatus: Status,
    operations: {
        update: (task: Task) => Promise<Task>;
        create: (task: Partial<Task>) => Promise<Task>;
        delete: (taskId: string) => Promise<void>;
    },
    onConfirmRestore?: () => void,
    onError?: (error: string) => void
) => {
    const result = await handleGoogleTasksStatusChange(task, newStatus, operations);

    if (result.success && result.task) {
        return result.task;
    }

    if (result.requiresConfirmation && onConfirmRestore) {
        onConfirmRestore();
        return null;
    }

    if (result.error && onError) {
        onError(result.error);
    }

    return null;
};

// Updated TaskDialog component integration
export const createRestoreConfirmationDialog = (
    task: Task,
    targetStatus: Status,
    onConfirm: () => void,
    onCancel: () => void
) => ({
    title: "Restore Completed Task",
    message: `Google Tasks doesn't allow restoring completed tasks directly. 
           Would you like to create a new task with the same content in "${targetStatus}" status instead?`,
    confirmText: "Create New Task",
    cancelText: "Cancel",
    onConfirm,
    onCancel,
    type: "warning" as const
});