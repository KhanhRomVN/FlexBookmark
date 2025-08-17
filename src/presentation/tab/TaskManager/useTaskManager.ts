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

// Updated folders to include overdue and exclude archive from main board
export const folders = [
    { id: "backlog", title: "Backlog", emoji: "📥" },
    { id: "todo", title: "To Do", emoji: "📋" },
    { id: "in-progress", title: "In Progress", emoji: "🚧" },
    { id: "overdue", title: "Overdue", emoji: "⏰" },
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
    const [filterTags, setFilterTags] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("created-desc");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [quickAddStatus, setQuickAddStatus] = useState<Status | null>(null);
    const [quickAddTitle, setQuickAddTitle] = useState("");
    const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);

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

    // Smart task status determination based on dates and times
    const determineTaskStatus = (task: Task): Status => {
        const now = new Date();

        // If task is completed, it goes to Done
        if (task.completed) {
            return "done";
        }

        // If task has no start date/time, it stays in Backlog
        if (!task.startDate && !task.startTime) {
            return "backlog";
        }

        // Get effective start and end times
        let startDateTime: Date | null = null;
        let endDateTime: Date | null = null;

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

        if (task.endDate && task.endTime) {
            endDateTime = new Date(
                task.endDate.getFullYear(),
                task.endDate.getMonth(),
                task.endDate.getDate(),
                task.endTime.getHours(),
                task.endTime.getMinutes(),
                task.endTime.getSeconds()
            );
        } else if (task.endDate) {
            endDateTime = new Date(task.endDate);
        } else if (task.endTime) {
            const today = new Date();
            endDateTime = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                task.endTime.getHours(),
                task.endTime.getMinutes(),
                task.endTime.getSeconds()
            );
        }

        // Check for overdue first (has due date and past due)
        if (endDateTime && now > endDateTime) {
            return "overdue";
        }

        // If not started yet, keep in Todo
        if (startDateTime && now < startDateTime) {
            return "todo";
        }

        // If started but not overdue, it's in progress
        if (startDateTime && now >= startDateTime) {
            // If no end date/time specified, it stays in progress until manually moved
            if (!endDateTime) {
                return "in-progress";
            }
            // If within the time window, it's in progress
            return "in-progress";
        }

        // Default fallback
        return task.status || "backlog";
    };

    // Check for overdue tasks and move them automatically
    const checkAndMoveOverdueTasks = (tasks: Task[]): Task[] => {
        return tasks.map(task => {
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
    };

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

            // Check for overdue tasks and auto-update status
            const tasksWithStatusCheck = checkAndMoveOverdueTasks(tasks);

            // Ensure all tasks have activity log
            const tasksWithActivityLog = tasksWithStatusCheck.map(task => ({
                ...task,
                activityLog: task.activityLog && task.activityLog.length > 0
                    ? task.activityLog
                    : createInitialActivityLog()
            }));

            const updated = folders.map((f) => ({
                ...f,
                tasks: tasksWithActivityLog.filter((t) => t.status === f.id),
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

    // Enhanced sort tasks based on different criteria
    const sortTasks = (tasks: Task[], sortType: string, order: 'asc' | 'desc' = 'desc'): Task[] => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const sortedTasks = [...tasks];

        switch (sortType) {
            case "priority-high":
            case "priority-low":
                sortedTasks.sort((a, b) => {
                    const comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
                    return sortType === "priority-low" ? -comparison : comparison;
                });
                break;
            case "due-date-asc":
            case "due-date-desc":
                sortedTasks.sort((a, b) => {
                    const dateA = a.endDate ? new Date(a.endDate).getTime() : (sortType === "due-date-asc" ? Infinity : -Infinity);
                    const dateB = b.endDate ? new Date(b.endDate).getTime() : (sortType === "due-date-asc" ? Infinity : -Infinity);
                    return sortType === "due-date-asc" ? dateA - dateB : dateB - dateA;
                });
                break;
            case "title-asc":
            case "title-desc":
                sortedTasks.sort((a, b) => {
                    const comparison = a.title.localeCompare(b.title);
                    return sortType === "title-desc" ? -comparison : comparison;
                });
                break;
            case "created-asc":
            case "created-desc":
                sortedTasks.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return sortType === "created-asc" ? dateA - dateB : dateB - dateA;
                });
                break;
            case "completion":
                sortedTasks.sort((a, b) => {
                    if (a.completed === b.completed) return 0;
                    return a.completed ? 1 : -1;
                });
                break;
            default:
                return tasks;
        }

        return order === 'asc' ? sortedTasks : sortedTasks.reverse();
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
                const oldStatus = moved.status;
                const newStatus = dest.id as Status;

                // Add activity log for status change
                const updatedTask = addActivityLogEntry(
                    { ...moved, status: newStatus },
                    "status_changed",
                    `Status changed from "${folders.find(f => f.id === oldStatus)?.title}" to "${folders.find(f => f.id === newStatus)?.title}"`
                );

                const copy = [...lists];
                copy[fromIndex].tasks = source.tasks.filter((t) => t.id !== active.id);
                copy[toIndex].tasks = [...dest.tasks, updatedTask];
                setLists(copy);
                saveTask(updatedTask);
            }
        }
    };

    // Quick Add with smart status determination
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
            startTime: status === "backlog" ? null : now,
            endTime: status === "backlog" ? null : oneHourLater,
            startDate: status === "backlog" ? null : startDate,
            endDate: status === "backlog" ? null : endDate,
            completed: false,
            subtasks: [],
            attachments: [],
            tags: [],
            activityLog: createInitialActivityLog(),
            prevTaskId: null,
            nextTaskId: null,
            createdAt: "",
            updatedAt: ""
        };

        // Determine the smart status
        const smartStatus = determineTaskStatus(newTask);
        newTask.status = smartStatus;

        try {
            const token = await getFreshToken();
            const created = await createGoogleTask(token, newTask, activeGroup);

            // Ensure created task has activity log
            const taskWithActivityLog = {
                ...created,
                activityLog: created.activityLog && created.activityLog.length > 0
                    ? created.activityLog
                    : createInitialActivityLog()
            };

            const idx = lists.findIndex((l) => l.id === smartStatus);
            if (idx !== -1) {
                const copy = [...lists];
                copy[idx].tasks = [...copy[idx].tasks, taskWithActivityLog];
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
        // Ensure task has activity log before opening dialog
        const taskWithActivityLog = {
            ...task,
            activityLog: task.activityLog && task.activityLog.length > 0
                ? task.activityLog
                : createInitialActivityLog()
        };

        setSelectedTask(taskWithActivityLog);
        setIsDialogOpen(true);
    };

    const handleCreateGroup = async () => {
        console.log("Create new group");
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!authState.user || !activeGroup) return;
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
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
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();
            const clone = {
                ...task,
                id: "",
                title: task.title + " (Copy)",
                activityLog: createInitialActivityLog()
            };
            const created = await createGoogleTask(token, clone, activeGroup);

            // Ensure duplicated task has activity log
            const taskWithActivityLog = {
                ...created,
                activityLog: created.activityLog && created.activityLog.length > 0
                    ? created.activityLog
                    : createInitialActivityLog()
            };

            const idx = lists.findIndex((l) => l.id === task.status);
            if (idx !== -1) {
                const copy = [...lists];
                copy[idx].tasks = [...copy[idx].tasks, taskWithActivityLog];
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

        const oldStatus = found.status;
        const updatedTask = addActivityLogEntry(
            { ...found, status: newStatus },
            "status_changed",
            `Status changed from "${folders.find(f => f.id === oldStatus)?.title}" to "${folders.find(f => f.id === newStatus)?.title}"`
        );

        setLists((prev) =>
            prev.map((l) => ({
                ...l,
                tasks:
                    l.id === newStatus
                        ? [...l.tasks, updatedTask]
                        : l.tasks.filter((t) => t.id !== taskId),
            }))
        );
        saveTask(updatedTask);
        setIsDialogOpen(false);
        setSelectedTask(null);
    };

    const handleSaveTaskDetail = async (task: Task) => {
        if (!authState.user || !activeGroup) return;
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            if (task.id) {
                // Check if status needs to be updated based on timing
                const smartStatus = determineTaskStatus(task);
                const finalTask = { ...task, status: smartStatus };

                // Add update activity log entry
                const updatedTask = addActivityLogEntry(
                    finalTask,
                    "updated",
                    `Task details updated at ${new Date().toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}`
                );

                await updateGoogleTask(token, task.id, updatedTask, activeGroup);
                setLists((prev) =>
                    prev.map((l) => ({
                        ...l,
                        tasks: l.id === smartStatus
                            ? [...l.tasks.filter((t) => t.id !== task.id), updatedTask]
                            : l.tasks.filter((t) => t.id !== task.id),
                    }))
                );
            } else {
                // Determine smart status for new task
                const smartStatus = determineTaskStatus(task);
                const newTask = { ...task, status: smartStatus };

                // Ensure new task has activity log
                const taskWithActivityLog = {
                    ...newTask,
                    activityLog: newTask.activityLog && newTask.activityLog.length > 0
                        ? newTask.activityLog
                        : createInitialActivityLog()
                };

                const created = await createGoogleTask(token, taskWithActivityLog, activeGroup);
                const idx = lists.findIndex((l) => l.id === smartStatus);
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

    // New handlers for folder actions
    const handleCopyTasks = async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder || !authState.user || !activeGroup) return;

        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            for (const task of folder.tasks) {
                const clone = {
                    ...task,
                    id: "",
                    title: task.title + " (Copy)",
                    activityLog: createInitialActivityLog()
                };
                await createGoogleTask(token, clone, activeGroup);
            }

            // Reload tasks to show the copies
            await loadTasks();
        } catch (err) {
            console.error("Failed to copy tasks:", err);
            setError("Failed to copy tasks.");
        }
    };

    const handleMoveTasks = async (fromFolderId: string, toFolderId: string) => {
        const fromFolder = lists.find(l => l.id === fromFolderId);
        if (!fromFolder) return;

        const updatedTasks = fromFolder.tasks.map(task =>
            addActivityLogEntry(
                { ...task, status: toFolderId as Status },
                "status_changed",
                `Moved from "${folders.find(f => f.id === fromFolderId)?.title}" to "${folders.find(f => f.id === toFolderId)?.title}"`
            )
        );

        setLists(prev => prev.map(l => ({
            ...l,
            tasks: l.id === toFolderId
                ? [...l.tasks, ...updatedTasks]
                : l.id === fromFolderId
                    ? []
                    : l.tasks
        })));

        // Save all moved tasks
        for (const task of updatedTasks) {
            await saveTask(task);
        }
    };

    const handleArchiveTasks = async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder) return;

        const archivedTasks = folder.tasks.map(task =>
            addActivityLogEntry(
                { ...task, status: "archive" },
                "archived",
                `Task archived from "${folders.find(f => f.id === folderId)?.title}"`
            )
        );

        setLists(prev => prev.map(l => ({
            ...l,
            tasks: l.id === "archive"
                ? [...l.tasks, ...archivedTasks]
                : l.id === folderId
                    ? []
                    : l.tasks
        })));

        // Save all archived tasks
        for (const task of archivedTasks) {
            await saveTask(task);
        }
    };

    const handleDeleteTasks = async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder || !authState.user || !activeGroup) return;

        if (!window.confirm(`Are you sure you want to delete all ${folder.tasks.length} tasks in ${folder.title}? This action cannot be undone.`)) {
            return;
        }

        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            for (const task of folder.tasks) {
                await deleteGoogleTask(token, task.id, activeGroup);
            }

            setLists(prev => prev.map(l => ({
                ...l,
                tasks: l.id === folderId ? [] : l.tasks
            })));
        } catch (err) {
            console.error("Failed to delete tasks:", err);
            setError("Failed to delete tasks.");
        }
    };

    const handleSortTasks = (folderId: string, sortType: string) => {
        setLists(prev => prev.map(l => ({
            ...l,
            tasks: l.id === folderId ? sortTasks(l.tasks, sortType, sortOrder) : l.tasks
        })));
    };

    // Individual task handlers
    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const handleMoveTask = (taskId: string, targetStatus: string) => {
        handleMove(taskId, targetStatus as Status);
    };

    const handleCopyTask = async (task: Task) => {
        if (!authState.user || !activeGroup) return;
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();
            const clone = {
                ...task,
                id: "",
                title: task.title + " (Copy)",
                activityLog: createInitialActivityLog()
            };
            const created = await createGoogleTask(token, clone, activeGroup);

            const idx = lists.findIndex((l) => l.id === task.status);
            if (idx !== -1) {
                const copy = [...lists];
                copy[idx].tasks = [...copy[idx].tasks, created];
                setLists(copy);
            }
        } catch (err) {
            console.error("Failed to copy task:", err);
            setError("Failed to copy task.");
        }
    };

    const handleArchiveTask = async (taskId: string) => {
        const task = lists.flatMap(l => l.tasks).find(t => t.id === taskId);
        if (!task) return;

        const archivedTask = addActivityLogEntry(
            { ...task, status: "archive" },
            "archived",
            "Task archived"
        );

        setLists(prev => prev.map(l => ({
            ...l,
            tasks: l.id === "archive"
                ? [...l.tasks, archivedTask]
                : l.tasks.filter(t => t.id !== taskId)
        })));

        await saveTask(archivedTask);
    };

    // Clear all filters function
    const handleClearFilters = () => {
        setSearchTerm("");
        setFilterPriority("all");
        setFilterStatus("all");
        setFilterTags("");
        setSortBy("created-desc");
        setSortOrder("desc");
    };

    // Enhanced filtering and sorting logic
    const filteredLists = useMemo(() => {
        return lists.map((l) => ({
            ...l,
            tasks: l.tasks
                .filter((t) => {
                    const matchesSearch =
                        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                        (t.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ?? false);

                    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
                    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
                    const matchesTags = filterTags === "" ||
                        (t.tags?.some(tag => tag.toLowerCase().includes(filterTags.toLowerCase())) ?? false);

                    return matchesSearch && matchesPriority && matchesStatus && matchesTags;
                })
                .sort((a, b) => {
                    return sortTasks([a, b], sortBy, sortOrder)[0] === a ? -1 : 1;
                }),
        }));
    }, [lists, searchTerm, filterPriority, filterStatus, filterTags, sortBy, sortOrder]);

    const totalTasks = lists.filter(l => l.id !== 'archive').reduce((sum, l) => sum + l.tasks.length, 0);
    const completedTasks = lists.find((l) => l.id === "done")?.tasks.length ?? 0;
    const overdueTasks = lists.find((l) => l.id === "overdue")?.tasks.length ?? 0;
    const urgentTasks = lists.filter(l => l.id !== 'archive').reduce(
        (sum, l) => sum + l.tasks.filter((t) => t.priority === "urgent").length,
        0
    );
    const archivedTasks = lists.find((l) => l.id === "archive")?.tasks ?? [];

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
        filterTags,
        setFilterTags,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
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
        overdueTasks,
        handleCopyTasks,
        handleMoveTasks,
        handleArchiveTasks,
        handleDeleteTasks,
        handleSortTasks,
        handleEditTask,
        handleMoveTask,
        handleCopyTask,
        handleArchiveTask,
        showArchiveDrawer,
        setShowArchiveDrawer,
        archivedTasks,
        handleClearFilters,
    };
}

// Helper function to add activity log entry
const addActivityLogEntry = (task: Task, action: string, details: string, userId: string = "user"): Task => {
    const now = new Date();
    const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details,
        action,
        userId,
        timestamp: now
    };

    return {
        ...task,
        activityLog: [...(task.activityLog || []), activityEntry]
    };
};

// Helper function to create initial activity log for new tasks
const createInitialActivityLog = (): any[] => {
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