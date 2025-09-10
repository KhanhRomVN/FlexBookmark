// src/presentation/components/TaskManager/TaskDialog/hooks/useActivityLog.ts
export const useActivityLog = (
    editedTask: any,
    setEditedTask: (task: any) => void,
    isCreateMode: boolean
) => {
    const addActivityLog = (action: string, details: string) => {
        if (isCreateMode) return;
        const now = new Date();
        const activityEntry = {
            id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
            details,
            action,
            userId: "user",
            timestamp: now,
        };
        setEditedTask({
            ...editedTask,
            activityLog: [...(editedTask.activityLog || []), activityEntry],
        });
    };

    return { addActivityLog };
};