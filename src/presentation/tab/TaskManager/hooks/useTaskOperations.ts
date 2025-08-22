import { useCallback, useRef, startTransition, useEffect } from "react";
import {
    fetchGoogleTasks,
    updateGoogleTask,
    createGoogleTask,
    deleteGoogleTask,
    verifyTokenScopes
} from "../../../../utils/GGTask";
import { useAuth } from "./useAuth";
import { useTaskGroups } from "./useTaskGroups";
import { useAdvancedDebounce } from "./useDebounce.";
import { AdvancedCache } from "./useCache";
import { PerformanceMonitor } from "./usePerformance";
import {
    determineTaskStatus,
    addActivityLogEntry,
    createInitialActivityLog,
    checkAndMoveOverdueTasks
} from "./useTaskHelpers";
import type { Task, Status } from "../../../types/task";
import type { TaskList } from "./useTaskState";
import { folders } from "../useTaskManager";

const DEBOUNCE_DELAY = 300;

export function useTaskOperations(
    lists: TaskList[],
    setLists: React.Dispatch<React.SetStateAction<TaskList[]>>,
    setError: (error: string | null) => void,
    setLoading: (loading: boolean) => void,
    quickAddTitle: string,
    setQuickAddTitle: (title: string) => void,
    setQuickAddStatus: (status: Status | null) => void,
    selectedTask: Task | null,
    setSelectedTask: (task: Task | null) => void,
    setIsDialogOpen: (open: boolean) => void
) {
    const { authState, getFreshToken } = useAuth();
    const { activeGroup } = useTaskGroups();
    const cache = useRef(new AdvancedCache<Task[]>());
    const performanceMonitor = useRef(new PerformanceMonitor());
    const abortController = useRef<AbortController | null>(null);
    const lastLoadTime = useRef<number>(0);
    const isLoadingRef = useRef<boolean>(false); // Prevent duplicate loads

    // Enhanced loadTasks function with better error handling
    const loadTasks = useCallback(async (force = false) => {

        if (!authState.user || !activeGroup || isLoadingRef.current) {
            return;
        }

        // Prevent duplicate loading
        isLoadingRef.current = true;

        // Abort previous request if still running
        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();

        const cacheKey = `tasks_${activeGroup}_${authState.user.email}`;

        if (!force) {
            const cached = cache.current.get(cacheKey);
            if (cached && Date.now() - lastLoadTime.current < 30000) { // 30 second cache
                const updated: TaskList[] = folders.map(f => ({
                    ...f,
                    tasks: cached.filter(t => t.status === f.id),
                }));
                startTransition(() => {
                    setLists(updated);
                });
                isLoadingRef.current = false;
                return;
            }
        }

        setLoading(true);
        setError(null);
        const endTimer = performanceMonitor.current.startTimer('loadTasks');

        try {

            // Get fresh token with proper scopes
            let token = authState.user.accessToken;

            // Always verify token scopes first
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }

            // Fetch tasks with proper error handling
            const tasks: Task[] = await fetchGoogleTasks(token, activeGroup);

            if (abortController.current?.signal.aborted) {
                return;
            }

            // Process tasks in batches for better performance
            const tasksWithStatusCheck = checkAndMoveOverdueTasks(tasks);
            const tasksWithActivityLog = tasksWithStatusCheck.map(task => ({
                ...task,
                activityLog: task.activityLog && task.activityLog.length > 0
                    ? task.activityLog
                    : createInitialActivityLog()
            }));


            // Cache the results
            cache.current.set(cacheKey, tasksWithActivityLog);
            lastLoadTime.current = Date.now();

            const updated: TaskList[] = folders.map(f => ({
                ...f,
                tasks: tasksWithActivityLog.filter(t => t.status === f.id),
            }));

            startTransition(() => {
                setLists(updated);
            });

        } catch (err: any) {
            if (abortController.current?.signal.aborted) {
                return;
            }

            console.error("Task load error:", err);

            // Provide more specific error messages
            let errorMessage = "Failed to load tasks.";

            if (err.message?.includes('403')) {
                errorMessage = "Access denied. Please check your permissions.";
            } else if (err.message?.includes('401')) {
                errorMessage = "Authentication failed. Please sign in again.";
            } else if (err.message?.includes('Network')) {
                errorMessage = "Network error. Please check your connection.";
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
            endTimer();
            isLoadingRef.current = false;
        }
    }, [authState, activeGroup, getFreshToken, setLists, setLoading, setError]);

    // Auto-load tasks when auth state or active group changes
    useEffect(() => {
        if (authState.isAuthenticated && authState.user && activeGroup) {
            loadTasks(true); // Force reload on auth/group change
        }
    }, [authState.isAuthenticated, authState.user?.email, activeGroup, loadTasks]);

    // Debounced save task function with better error handling
    const saveTask = useAdvancedDebounce(
        useCallback(async (task: Task) => {
            if (!authState.user || !activeGroup) {
                return;
            }

            const endTimer = performanceMonitor.current.startTimer('saveTask');

            try {
                let token = authState.user.accessToken;
                const tokenInfo = await verifyTokenScopes(token);
                if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                    token = await getFreshToken();
                }

                await updateGoogleTask(token, task.id, task, activeGroup);

                // Persist collection mapping for the task
                try {
                    const map = JSON.parse(localStorage.getItem('taskCollections') || '{}');
                    map[task.id] = task.collection || '';
                    localStorage.setItem('taskCollections', JSON.stringify(map));
                } catch {
                    // ignore storage errors
                }

                // Update cache
                cache.current.clear(); // Clear to force refresh

            } catch (err: any) {
                console.error("Failed to save task:", err);
                setError(`Failed to save task: ${err.message || 'Unknown error'}`);

                // Force reload on error to sync state
                setTimeout(() => {
                    loadTasks(true);
                }, 1000);
            } finally {
                endTimer();
            }
        }, [authState, activeGroup, getFreshToken, loadTasks, setError]),
        DEBOUNCE_DELAY,
        { maxWait: 2000 }
    );

    const handleDeleteTask = useCallback(async (taskId: string) => {
        if (!authState.user || !activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('deleteTask');
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            await deleteGoogleTask(token, taskId, activeGroup);

            startTransition(() => {
                setLists(prev =>
                    prev.map(l => ({
                        ...l,
                        tasks: l.tasks.filter(t => t.id !== taskId)
                    }))
                );
            });

            if (selectedTask?.id === taskId) {
                setIsDialogOpen(false);
                setSelectedTask(null);
            }

            cache.current.clear();
        } catch (err: any) {
            console.error("Failed to delete task:", err);
            setError(`Failed to delete task: ${err.message || 'Unknown error'}`);
        } finally {
            endTimer();
        }
    }, [authState, activeGroup, getFreshToken, selectedTask, setLists, setIsDialogOpen, setSelectedTask, setError]);

    const handleDuplicateTask = useCallback(async (task: Task) => {
        if (!authState.user || !activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('duplicateTask');
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
            const taskWithActivityLog = {
                ...created,
                activityLog: created.activityLog && created.activityLog.length > 0
                    ? created.activityLog
                    : createInitialActivityLog()
            };

            const idx = lists.findIndex(l => l.id === task.status);
            if (idx !== -1) {
                startTransition(() => {
                    setLists(prev => {
                        const copy = [...prev];
                        copy[idx].tasks = [...copy[idx].tasks, taskWithActivityLog];
                        return copy;
                    });
                });
            }

            cache.current.clear();
        } catch (err: any) {
            console.error("Failed to duplicate task:", err);
            setError(`Failed to duplicate task: ${err.message || 'Unknown error'}`);
        } finally {
            endTimer();
        }
    }, [authState, activeGroup, getFreshToken, lists, setLists, setError]);

    const handleMove = useCallback(async (taskId: string, newStatus: Status) => {
        const found = lists.flatMap(l => l.tasks).find(t => t.id === taskId);
        if (!found) return;

        const oldStatus = found.status;
        const updatedTask = addActivityLogEntry(
            { ...found, status: newStatus },
            "status_changed",
            `Status changed from "${folders.find(f => f.id === oldStatus)?.title}" to "${folders.find(f => f.id === newStatus)?.title}"`
        );

        startTransition(() => {
            setLists(prev =>
                prev.map(l => ({
                    ...l,
                    tasks: l.id === newStatus
                        ? [...l.tasks.filter(t => t.id !== taskId), updatedTask]
                        : l.tasks.filter(t => t.id !== taskId)
                }))
            );
        });

        await saveTask(updatedTask);
        setIsDialogOpen(false);
        setSelectedTask(null);
    }, [lists, saveTask, setLists, setIsDialogOpen, setSelectedTask]);

    // Enhanced quick add with smart defaults
    const handleQuickAddTask = useCallback(async (status: Status) => {
        if (!quickAddTitle.trim() || !authState.user || !activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('quickAddTask');
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        const dueDate = new Date(now);
        dueDate.setHours(23, 59, 59, 999);

        const newTask: Task = {
            id: "",
            title: quickAddTitle,
            description: "",
            status,
            priority: "medium",
            startTime: status === "backlog" ? null : now,
            dueTime: status === "backlog" ? null : oneHourLater,
            startDate: status === "backlog" ? null : startDate,
            dueDate: status === "backlog" ? null : dueDate,
            completed: false,
            subtasks: [],
            attachments: [],
            tags: [],
            activityLog: createInitialActivityLog(),
            createdAt: "",
            updatedAt: ""
        };

        // Determine the smart status
        const smartStatus = determineTaskStatus(newTask);
        newTask.status = smartStatus;

        try {
            const token = await getFreshToken();
            const created = await createGoogleTask(token, newTask, activeGroup);

            const taskWithActivityLog = {
                ...created,
                activityLog: created.activityLog && created.activityLog.length > 0
                    ? created.activityLog
                    : createInitialActivityLog()
            };

            const idx = lists.findIndex(l => l.id === smartStatus);
            if (idx !== -1) {
                startTransition(() => {
                    setLists(prev => {
                        const copy = [...prev];
                        copy[idx].tasks = [...copy[idx].tasks, taskWithActivityLog];
                        return copy;
                    });
                });
            }

            // Clear cache to ensure fresh data
            cache.current.clear();
        } catch (err: any) {
            console.error("Failed to create task:", err);
            setError(`Failed to create task: ${err.message || 'Unknown error'}`);
        } finally {
            setQuickAddTitle("");
            setQuickAddStatus(null);
            endTimer();
        }
    }, [quickAddTitle, authState, activeGroup, getFreshToken, lists, setLists, setQuickAddTitle, setQuickAddStatus, setError]);

    // Batch operations for better performance
    const handleBatchOperations = {
        deleteMultiple: useCallback(async (taskIds: string[]) => {
            if (!authState.user || !activeGroup) return;

            const endTimer = performanceMonitor.current.startTimer('batchDelete');
            const batchSize = 10;
            const token = await getFreshToken();

            try {
                for (let i = 0; i < taskIds.length; i += batchSize) {
                    const batch = taskIds.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(taskId => deleteGoogleTask(token, taskId, activeGroup))
                    );
                }

                startTransition(() => {
                    setLists(prev =>
                        prev.map(l => ({
                            ...l,
                            tasks: l.tasks.filter(t => !taskIds.includes(t.id))
                        }))
                    );
                });

                cache.current.clear();
            } catch (err: any) {
                console.error("Failed to delete tasks:", err);
                setError(`Failed to delete tasks: ${err.message || 'Unknown error'}`);
            } finally {
                endTimer();
            }
        }, [authState, activeGroup, getFreshToken, setLists, setError]),

        updateMultiple: useCallback(async (updates: Array<{ id: string; changes: Partial<Task> }>) => {
            if (!authState.user || !activeGroup) return;

            const endTimer = performanceMonitor.current.startTimer('batchUpdate');
            const batchSize = 5;
            const token = await getFreshToken();

            try {
                for (let i = 0; i < updates.length; i += batchSize) {
                    const batch = updates.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(async ({ id, changes }) => {
                            const existingTask = lists.flatMap(l => l.tasks).find(t => t.id === id);
                            if (existingTask) {
                                const updatedTask = { ...existingTask, ...changes };
                                await updateGoogleTask(token, id, updatedTask, activeGroup);
                                return updatedTask;
                            }
                        })
                    );
                }

                // Reload tasks after batch update
                await loadTasks(true);
            } catch (err: any) {
                console.error("Failed to update tasks:", err);
                setError(`Failed to update tasks: ${err.message || 'Unknown error'}`);
            } finally {
                endTimer();
            }
        }, [authState, activeGroup, getFreshToken, lists, loadTasks, setError]),

        copyTasks: useCallback(async (tasks: Task[]) => {
            if (!authState.user || !activeGroup) return;

            const endTimer = performanceMonitor.current.startTimer('copyTasks');
            try {
                const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
                const token = tokenInfo?.scope?.includes("tasks")
                    ? authState.user.accessToken
                    : await getFreshToken();

                const batchSize = 5;
                for (let i = 0; i < tasks.length; i += batchSize) {
                    const batch = tasks.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(task => {
                            const clone = {
                                ...task,
                                id: "",
                                title: task.title + " (Copy)",
                                activityLog: createInitialActivityLog()
                            };
                            return createGoogleTask(token, clone, activeGroup);
                        })
                    );
                }

                await loadTasks(true);
            } catch (err: any) {
                console.error("Failed to copy tasks:", err);
                setError(`Failed to copy tasks: ${err.message || 'Unknown error'}`);
            } finally {
                endTimer();
            }
        }, [authState, activeGroup, getFreshToken, loadTasks, setError]),

        moveTasks: useCallback(async (tasks: Task[], newStatus: Status) => {
            const updatedTasks = tasks.map(task =>
                addActivityLogEntry(
                    { ...task, status: newStatus },
                    "status_changed",
                    `Moved from "${folders.find(f => f.id === task.status)?.title}" to "${folders.find(f => f.id === newStatus)?.title}"`
                )
            );

            startTransition(() => {
                setLists(prev => prev.map(l => ({
                    ...l,
                    tasks: l.id === newStatus
                        ? [...l.tasks, ...updatedTasks]
                        : l.tasks.filter(t => !tasks.some(task => task.id === t.id))
                })));
            });

            // Save all moved tasks in batches
            const batchSize = 5;
            for (let i = 0; i < updatedTasks.length; i += batchSize) {
                const batch = updatedTasks.slice(i, i + batchSize);
                await Promise.all(batch.map(task => saveTask(task)));
            }
        }, [saveTask, setLists]),

        archiveTasks: useCallback(async (tasks: Task[]) => {
            const archivedTasks = tasks.map(task =>
                addActivityLogEntry(
                    { ...task, status: "archive" },
                    "archived",
                    `Task archived from "${folders.find(f => f.id === task.status)?.title}"`
                )
            );

            startTransition(() => {
                setLists(prev => prev.map(l => ({
                    ...l,
                    tasks: l.id === "archive"
                        ? [...l.tasks, ...archivedTasks]
                        : l.tasks.filter(t => !tasks.some(task => task.id === t.id))
                })));
            });

            // Save all archived tasks in batches
            const batchSize = 5;
            for (let i = 0; i < archivedTasks.length; i += batchSize) {
                const batch = archivedTasks.slice(i, i + batchSize);
                await Promise.all(batch.map(task => saveTask(task)));
            }
        }, [saveTask, setLists])
    };

    const handleSaveTaskDetail = useCallback(async (task: Task) => {
        if (!authState.user || !activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer("saveTaskDetail");
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            if (task.id) {
                const smartStatus = determineTaskStatus(task);
                const finalTask = { ...task, status: smartStatus };

                // Process subtasks with linked tasks
                const processedSubtasks =
                    task.subtasks?.map((subtask) => {
                        if (subtask.linkedTaskId) {
                            // Add activity log to linked task if it exists
                            const linkedTask = lists
                                .flatMap((l) => l.tasks)
                                .find((t) => t.id === subtask.linkedTaskId);
                            if (linkedTask) {
                                const updatedLinkedTask = addActivityLogEntry(
                                    linkedTask,
                                    "subtask_linked",
                                    `Linked as subtask "${subtask.title}" in task "${task.title}"`
                                );
                                // Save the linked task
                                saveTask(updatedLinkedTask);
                            }
                        }
                        return subtask;
                    }) || [];

                const updatedTask = addActivityLogEntry(
                    { ...finalTask, subtasks: processedSubtasks },
                    "updated",
                    `Task details updated at ${new Date().toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    })}`
                );

                await updateGoogleTask(token, task.id, updatedTask, activeGroup);

                startTransition(() => {
                    setLists((prev) =>
                        prev.map((l) => ({
                            ...l,
                            tasks:
                                l.id === smartStatus
                                    ? [
                                        ...l.tasks.filter((t) => t.id !== task.id),
                                        updatedTask,
                                    ]
                                    : l.tasks.filter((t) => t.id !== task.id),
                        }))
                    );
                });
            } else {
                const smartStatus = determineTaskStatus(task);
                const newTask = { ...task, status: smartStatus };

                // Process subtasks for new task
                const processedSubtasks =
                    task.subtasks?.map((subtask) => {
                        if (subtask.linkedTaskId) {
                            // Add activity log to linked task if it exists
                            const linkedTask = lists
                                .flatMap((l) => l.tasks)
                                .find((t) => t.id === subtask.linkedTaskId);
                            if (linkedTask) {
                                const updatedLinkedTask = addActivityLogEntry(
                                    linkedTask,
                                    "subtask_linked",
                                    `Linked as subtask "${subtask.title}" in new task "${task.title}"`
                                );
                                // Save the linked task
                                saveTask(updatedLinkedTask);
                            }
                        }
                        return subtask;
                    }) || [];

                const taskWithActivityLog = {
                    ...newTask,
                    subtasks: processedSubtasks,
                    activityLog:
                        newTask.activityLog && newTask.activityLog.length > 0
                            ? newTask.activityLog
                            : createInitialActivityLog(),
                };

                const created = await createGoogleTask(
                    token,
                    taskWithActivityLog,
                    activeGroup
                );
                const idx = lists.findIndex((l) => l.id === smartStatus);
                if (idx !== -1) {
                    startTransition(() => {
                        setLists((prev) => {
                            const copy = [...prev];
                            copy[idx].tasks = [...copy[idx].tasks, created];
                            return copy;
                        });
                    });
                }
            }

            setIsDialogOpen(false);
            setSelectedTask(null);
            cache.current.clear();
        } catch (err: any) {
            console.error("Failed to save task:", err);
            setError(`Failed to save task: ${err.message || "Unknown error"}`);
        } finally {
            endTimer();
        }
    }, [authState, activeGroup, getFreshToken, lists, saveTask, setLists, setIsDialogOpen, setSelectedTask, setError]);


    return {
        saveTask,
        loadTasks,
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        handleQuickAddTask,
        handleSaveTaskDetail,
        handleBatchOperations,
    };
}