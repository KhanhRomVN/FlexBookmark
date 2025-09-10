import { useState } from "react";
import type { Task, Status } from "../types/task";
import { folders } from "../useTaskManager";

export interface TaskList {
    id: string;
    title: string;
    emoji: string;
    priority: number;
    tasks: Task[];
}

export function useTaskState() {
    const [lists, setLists] = useState<TaskList[]>(
        folders.map((f) => ({ ...f, tasks: [] }))
    );
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quickAddStatus, setQuickAddStatus] = useState<Status | null>(null);
    const [quickAddTitle, setQuickAddTitle] = useState("");
    const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);

    return {
        lists,
        setLists,
        selectedTask,
        setSelectedTask,
        isDialogOpen,
        setIsDialogOpen,
        loading,
        setLoading,
        error,
        setError,
        quickAddStatus,
        setQuickAddStatus,
        quickAddTitle,
        setQuickAddTitle,
        showArchiveDrawer,
        setShowArchiveDrawer,
    };
}