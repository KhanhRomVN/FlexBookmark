// src/presentation/components/TaskManager/TaskDialog/hooks/useTaskState.ts
import { useState, useEffect } from "react";
import { Task } from "../../../../types/task";

export const useTaskState = (task: Task | null, isCreateMode: boolean) => {
    const [editedTask, setEditedTask] = useState<Task | null>(task);

    useEffect(() => {
        setEditedTask(task);
    }, [task]);

    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask((prev) => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    return { editedTask, setEditedTask, handleChange };
};