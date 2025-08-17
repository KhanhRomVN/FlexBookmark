import { useState, useEffect, useMemo } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
    fetchGoogleTasks,
    updateGoogleTask,
    createGoogleTask,
    fetchGoogleTaskGroups,
    deleteGoogleTask,
    verifyTokenScopes,
} from "../../../utils/GGTask";
import ChromeAuthManager from "../../../utils/chromeAuth";
import type { AuthState } from "../../../utils/chromeAuth";
import type { Task, Status } from "../../types/task";

export const folders = [
    { id: "backlog", title: "Backlog", emoji: "📥" },
    { id: "todo", title: "To Do", emoji: "📋" },
    { id: "in-progress", title: "In Progress", emoji: "🚧" },
    { id: "done", title: "Done", emoji: "✅" },
    { id: "archive", title: "Archive", emoji: "🗄️" },
];

interface TaskList {
    id: string;
    title: string;
    emoji: string;
    tasks: Task[];
}

export function useTaskManager() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });
    const [groups, setGroups] = useState<any[]>([]);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [lists, setLists] = useState<TaskList[]>(
        folders.map((f) => ({ ...f, tasks: [] }))
    );
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [quickAddStatus, setQuickAddStatus] = useState<Status | null>(null);
    const [quickAddTitle, setQuickAddTitle] = useState("");

    const authManager = ChromeAuthManager.getInstance();

    // Helper to clear cached token and fetch a fresh one
    const getFreshToken = async (): Promise<string> => {
        try {
            if (authState.user?.accessToken) {
                await new Promise<void>((resolve) =>
                    chrome.identity.removeCachedAuthToken(
                        { token: authState.user!.accessToken },
                        () => resolve()
                    )
                );
            }
            const user = await authManager.login();
            return user.accessToken;
        } catch (error) {
            console.error("Failed to get fresh token:", error);
            throw error;
        }
    };

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState: any) => {
            setAuthState(newState);
        });
        authManager.initialize();
        return unsubscribe;
    }, [authManager]);

    // Load available groups once authenticated
    useEffect(() => {
        if (authState.isAuthenticated && authState.user?.accessToken) {
            loadTaskGroups();
        }
    }, [authState]);

    const loadTaskGroups = async () => {
        if (!authState.user) return;
        try {
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }
            const groups = await fetchGoogleTaskGroups(token);
            setGroups(groups);
            if (groups.length) setActiveGroup(groups[0].id);
        } catch (err) {
            console.error("Failed to load task groups:", err);
            setError("Failed to load task groups.");
        }
    };

    // When activeGroup changes, fetch tasks
    useEffect(() => {
        if (activeGroup && authState.user?.accessToken) {
            loadTasks();
        }
    }, [activeGroup]);

    const loadTasks = async () => {
        if (!authState.user || !activeGroup) return;
        setLoading(true);
        setError(null);
        try {
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }
            const tasks: Task[] = await fetchGoogleTasks(token, activeGroup);
            const updated = folders.map((f) => ({
                ...f,
                tasks: tasks.filter((t) => t.status === f.id),
            }));
            setLists(updated);
        } catch (err) {
            console.error("Task load error:", err);
            setError("Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    };

    // Persist task changes
    const saveTask = async (task: Task) => {
        if (!authState.user || !activeGroup) return;
        try {
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }
            await updateGoogleTask(token, task.id, task, activeGroup);
        } catch (err) {
            console.error("Failed to save task:", err);
            setError("Failed to save task.");
            loadTasks(); // revert on error
        }
    };

    // Handle drag-n-drop between lists
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const fromIndex = lists.findIndex((l) =>
                l.tasks.some((t) => t.id === active.id)
            );
            const toIndex = lists.findIndex(
                (l) => l.tasks.some((t) => t.id === over.id) || l.id === over.id
            );
            if (fromIndex === -1 || toIndex === -1) return;
            const source = lists[fromIndex];
            const dest = lists[toIndex];
            const itemIndex = source.tasks.findIndex((t) => t.id === active.id);

            if (fromIndex === toIndex) {
                const reordered = arrayMove(source.tasks, itemIndex, itemIndex);
                const copy = [...lists];
                copy[fromIndex].tasks = reordered;
                setLists(copy);
            } else {
                const moved = source.tasks[itemIndex];
                moved.status = dest.id as Status;
                const copy = [...lists];
                copy[fromIndex].tasks = source.tasks.filter((t) => t.id !== active.id);
                copy[toIndex].tasks = [...dest.tasks, moved];
                setLists(copy);
                saveTask(moved);
            }
        }
    };

    // Quick Add
    const handleQuickAddTask = async (status: Status) => {
        if (!quickAddTitle.trim() || !authState.user || !activeGroup) return;
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        const newTask: Task = {
            id: "",
            title: quickAddTitle,
            description: "",
            status,
            priority: "medium",
            startTime: now,
            endTime: oneHourLater,
            startDate,
            endDate,
            completed: false,
            subtasks: [],
            attachments: [],
            tags: [],
            activityLog: [],
            prevTaskId: null,
            nextTaskId: null,
        };

        try {
            const token = await getFreshToken();
            const created = await createGoogleTask(token, newTask, activeGroup);
            const idx = lists.findIndex((l) => l.id === status);
            if (idx !== -1) {
                const copy = [...lists];
                copy[idx].tasks = [...copy[idx].tasks, created];
                setLists(copy);
            }
        } catch (err) {
            console.error("Failed to create task:", err);
            setError("Failed to create task.");
        } finally {
            setQuickAddTitle("");
            setQuickAddStatus(null);
        }
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const handleCreateGroup = async () => {
        console.log("Create new group");
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!authState.user || !activeGroup) return;
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();
            await deleteGoogleTask(token, taskId, activeGroup);
            setLists((prev) =>
                prev.map((l) => ({
                    ...l,
                    tasks: l.tasks.filter((t) => t.id !== taskId),
                }))
            );
            if (selectedTask?.id === taskId) {
                setIsDialogOpen(false);
                setSelectedTask(null);
            }
        } catch (err) {
            console.error("Failed to delete task:", err);
            setError("Failed to delete task.");
        }
    };

    const handleDuplicateTask = async (task: Task) => {
        if (!authState.user || !activeGroup) return;
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();
            const clone = { ...task, id: "", title: task.title + " (Copy)", activityLog: [] };
            const created = await createGoogleTask(token, clone, activeGroup);
            const idx = lists.findIndex((l) => l.id === task.status);
            if (idx !== -1) {
                const copy = [...lists];
                copy[idx].tasks = [...copy[idx].tasks, created];
                setLists(copy);
            }
        } catch (err) {
            console.error("Failed to duplicate task:", err);
            setError("Failed to duplicate task.");
        }
    };

    const handleMove = (taskId: string, newStatus: Status) => {
        const found = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
        if (!found) return;
        const updated = { ...found, status: newStatus };
        setLists((prev) =>
            prev.map((l) => ({
                ...l,
                tasks:
                    l.id === newStatus
                        ? [...l.tasks, updated]
                        : l.tasks.filter((t) => t.id !== taskId),
            }))
        );
        saveTask(updated);
        setIsDialogOpen(false);
        setSelectedTask(null);
    };

    const handleSaveTaskDetail = async (task: Task) => {
        if (!authState.user || !activeGroup) return;
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();
            if (task.id) {
                await updateGoogleTask(token, task.id, task, activeGroup);
                setLists((prev) =>
                    prev.map((l) => ({
                        ...l,
                        tasks: l.tasks.map((t) => (t.id === task.id ? task : t)),
                    }))
                );
            } else {
                const created = await createGoogleTask(token, task, activeGroup);
                const idx = lists.findIndex((l) => l.id === task.status);
                if (idx !== -1) {
                    const copy = [...lists];
                    copy[idx].tasks = [...copy[idx].tasks, created];
                    setLists(copy);
                }
            }
            setIsDialogOpen(false);
            setSelectedTask(null);
        } catch (err) {
            console.error("Failed to save task:", err);
            setError("Failed to save task.");
        }
    };

    const filteredLists = useMemo(() => {
        return lists.map((l) => ({
            ...l,
            tasks: l.tasks.filter((t) => {
                const matchesSearch =
                    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
                const matchesPriority =
                    filterPriority === "all" || t.priority === filterPriority;
                const matchesStatus = filterStatus === "all" || t.status === filterStatus;
                return matchesSearch && matchesPriority && matchesStatus;
            }),
        }));
    }, [lists, searchTerm, filterPriority, filterStatus]);

    const totalTasks = lists.reduce((sum, l) => sum + l.tasks.length, 0);
    const completedTasks = lists.find((l) => l.id === "done")?.tasks.length ?? 0;
    const urgentTasks = lists.reduce(
        (sum, l) => sum + l.tasks.filter((t) => t.priority === "urgent").length,
        0
    );

    return {
        authState,
        groups,
        activeGroup,
        setActiveGroup,
        lists,
        filteredLists,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterPriority,
        setFilterPriority,
        filterStatus,
        setFilterStatus,
        quickAddStatus,
        setQuickAddStatus,
        quickAddTitle,
        setQuickAddTitle,
        selectedTask,
        isDialogOpen,
        setIsDialogOpen,
        setSelectedTask,
        handleDragEnd,
        handleQuickAddTask,
        handleTaskClick,
        handleCreateGroup,
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        handleSaveTaskDetail,
        totalTasks,
        completedTasks,
        urgentTasks,
    };
}