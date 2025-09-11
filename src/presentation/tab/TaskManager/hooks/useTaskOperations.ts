import { useCallback, useRef, useEffect, startTransition } from "react";
import type { Task, Status } from "../types/task";
import { TaskList, folders } from "./useTaskState";
import { useTaskGroups } from "./useTaskGroups";
import { useAdvancedDebounce } from "./useAdvancedDebounce";
import {
    fetchGoogleTasks,
    updateGoogleTask,
    deleteGoogleTask,
    createGoogleTask
} from "../services/GoogleTaskService";

// Constants
const CACHE_TTL = 5 * 60 * 1000;
const DEBOUNCE_DELAY = 300;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Cache implementation
class AdvancedCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private maxSize = 100;

    set(key: string, data: T, ttl: number = CACHE_TTL): void {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }
}

// Performance monitoring
class PerformanceMonitor {
    private metrics = new Map<string, number[]>();

    startTimer(operation: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            if (!this.metrics.has(operation)) {
                this.metrics.set(operation, []);
            }
            const measurements = this.metrics.get(operation)!;
            measurements.push(duration);

            if (measurements.length > 100) {
                measurements.splice(0, measurements.length - 100);
            }
        };
    }

    getAverageTime(operation: string): number {
        const measurements = this.metrics.get(operation);
        if (!measurements || measurements.length === 0) return 0;
        return measurements.reduce((a, b) => a + b, 0) / measurements.length;
    }

    getStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
        const stats: Record<string, any> = {};
        for (const [operation, measurements] of this.metrics) {
            if (measurements.length > 0) {
                stats[operation] = {
                    avg: this.getAverageTime(operation),
                    min: Math.min(...measurements),
                    max: Math.max(...measurements),
                    count: measurements.length
                };
            }
        }
        return stats;
    }
}

// Helper functions - simplified implementations
const checkAndMoveOverdueTasks = (tasks: Task[]): Task[] => {
    return tasks.map(task => {
        // Simple overdue check
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done') {
            return { ...task, status: 'overdue' as Status };
        }
        return task;
    });
};

const createInitialActivityLog = () => {
    const now = new Date();
    return [{
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
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
    }];
};

const addActivityLogEntry = (task: Task, action: string, details: string): Task => {
    const now = new Date();
    const newEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details,
        action,
        userId: "system",
        timestamp: now,
    };

    return {
        ...task,
        activityLog: [...(task.activityLog || []), newEntry]
    };
};

export const determineTaskStatus = (task: Task): Status => {
    // Simple status determination logic
    if (task.completed) return 'done';
    if (task.dueDate && new Date(task.dueDate) < new Date()) return 'overdue';
    if (task.status) return task.status;
    return 'todo';
};

// UPDATED: Function signature now takes getFreshToken instead of authState
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
    setIsDialogOpen: (open: boolean) => void,
    getFreshToken: () => Promise<string> // CHANGED: Use getFreshToken from centralized auth
) {
    const { activeGroup } = useTaskGroups();
    const cache = useRef(new AdvancedCache<Task[]>());
    const performanceMonitor = useRef(new PerformanceMonitor());
    const abortController = useRef<AbortController | null>(null);
    const lastLoadTime = useRef<number>(0);
    const isLoadingRef = useRef<boolean>(false);

    const loadTasks = useCallback(async (force = false) => {
        if (!activeGroup || isLoadingRef.current) {
            return;
        }

        isLoadingRef.current = true;

        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();

        const cacheKey = `tasks_${activeGroup}`;

        if (!force) {
            const cached = cache.current.get(cacheKey);
            if (cached && Date.now() - lastLoadTime.current < 30000) {
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
            // CHANGED: Use getFreshToken from centralized auth
            const token = await getFreshToken();
            const tasks: Task[] = await fetchGoogleTasks(token, activeGroup);

            if (abortController.current?.signal.aborted) {
                return;
            }

            const tasksWithStatusCheck = checkAndMoveOverdueTasks(tasks);
            const tasksWithActivityLog = tasksWithStatusCheck.map(task => ({
                ...task,
                activityLog: task.activityLog && task.activityLog.length > 0
                    ? task.activityLog
                    : createInitialActivityLog()
            }));

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
    }, [activeGroup, setLists, setLoading, setError, getFreshToken]);

    // CHANGED: Removed direct authState dependency, loadTasks will be called from parent component
    useEffect(() => {
        if (activeGroup) {
            loadTasks(true);
        }
    }, [activeGroup, loadTasks]);

    const saveTask = useAdvancedDebounce(
        useCallback(async (task: Task) => {
            if (!activeGroup) {
                return;
            }

            const endTimer = performanceMonitor.current.startTimer('saveTask');

            try {
                // CHANGED: Use getFreshToken from centralized auth
                const token = await getFreshToken();
                await updateGoogleTask(token, task.id, task, activeGroup);

                try {
                    const map = JSON.parse(localStorage.getItem('taskCollections') || '{}');
                    map[task.id] = task.collection || '';
                    localStorage.setItem('taskCollections', JSON.stringify(map));
                } catch {
                    // ignore storage errors
                }

                cache.current.clear();
            } catch (err: any) {
                console.error("Failed to save task:", err);
                setError(`Failed to save task: ${err.message || 'Unknown error'}`);
                setTimeout(() => {
                    loadTasks(true);
                }, 1000);
            } finally {
                endTimer();
            }
        }, [activeGroup, loadTasks, setError, getFreshToken]),
        DEBOUNCE_DELAY,
        { maxWait: 2000 }
    );

    const handleDeleteTask = useCallback(async (taskId: string) => {
        if (!activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('deleteTask');
        try {
            // CHANGED: Use getFreshToken from centralized auth
            const token = await getFreshToken();
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
    }, [activeGroup, selectedTask, setLists, setIsDialogOpen, setSelectedTask, setError, getFreshToken]);

    const handleDuplicateTask = useCallback(async (task: Task) => {
        if (!activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('duplicateTask');
        try {
            // CHANGED: Use getFreshToken from centralized auth
            const token = await getFreshToken();

            const clone: Partial<Task> = {
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
    }, [activeGroup, lists, setLists, setError, getFreshToken]);

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

    const handleQuickAddTask = useCallback(async (status: Status) => {
        if (!quickAddTitle.trim() || !activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('quickAddTask');
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        const dueDate = new Date(now);
        dueDate.setHours(23, 59, 59, 999);

        const newTask: Partial<Task> = {
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
            linkedTasks: []
        };

        const smartStatus = determineTaskStatus(newTask as Task);
        newTask.status = smartStatus;

        try {
            // CHANGED: Use getFreshToken from centralized auth
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

            cache.current.clear();
        } catch (err: any) {
            console.error("Failed to create task:", err);
            setError(`Failed to create task: ${err.message || 'Unknown error'}`);
        } finally {
            setQuickAddTitle("");
            setQuickAddStatus(null);
            endTimer();
        }
    }, [quickAddTitle, activeGroup, lists, setLists, setQuickAddTitle, setQuickAddStatus, setError, getFreshToken]);

    const handleBatchOperations = {
        deleteMultiple: useCallback(async (taskIds: string[]) => {
            if (!activeGroup) return;

            const endTimer = performanceMonitor.current.startTimer('batchDelete');
            const batchSize = 10;

            try {
                // CHANGED: Use getFreshToken from centralized auth
                const token = await getFreshToken();

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
        }, [activeGroup, setLists, setError, getFreshToken]),

        updateMultiple: useCallback(async (updates: Array<{ id: string; changes: Partial<Task> }>) => {
            if (!activeGroup) return;

            const endTimer = performanceMonitor.current.startTimer('batchUpdate');
            const batchSize = 5;

            try {
                // CHANGED: Use getFreshToken from centralized auth
                const token = await getFreshToken();

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

                await loadTasks(true);
            } catch (err: any) {
                console.error("Failed to update tasks:", err);
                setError(`Failed to update tasks: ${err.message || 'Unknown error'}`);
            } finally {
                endTimer();
            }
        }, [activeGroup, lists, loadTasks, setError, getFreshToken]),

        copyTasks: useCallback(async (tasks: Task[]) => {
            if (!activeGroup) return;

            const endTimer = performanceMonitor.current.startTimer('copyTasks');
            try {
                // CHANGED: Use getFreshToken from centralized auth
                const token = await getFreshToken();

                const batchSize = 5;
                for (let i = 0; i < tasks.length; i += batchSize) {
                    const batch = tasks.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(task => {
                            const clone: Partial<Task> = {
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
        }, [activeGroup, loadTasks, setError, getFreshToken]),

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

            const batchSize = 5;
            for (let i = 0; i < archivedTasks.length; i += batchSize) {
                const batch = archivedTasks.slice(i, i + batchSize);
                await Promise.all(batch.map(task => saveTask(task)));
            }
        }, [saveTask, setLists])
    };

    const handleSaveTaskDetail = useCallback(async (task: Task) => {
        if (!activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer("saveTaskDetail");
        try {
            // CHANGED: Use getFreshToken from centralized auth
            const token = await getFreshToken();

            if (task.id) {
                const smartStatus = determineTaskStatus(task);
                const finalTask = { ...task, status: smartStatus };

                const processedSubtasks =
                    task.subtasks?.map((subtask) => {
                        if (subtask.linkedTaskId) {
                            const linkedTask = lists
                                .flatMap((l) => l.tasks)
                                .find((t) => t.id === subtask.linkedTaskId);
                            if (linkedTask) {
                                const updatedLinkedTask = addActivityLogEntry(
                                    linkedTask,
                                    "subtask_linked",
                                    `Linked as subtask "${subtask.title}" in task "${task.title}"`
                                );
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

                const processedSubtasks =
                    task.subtasks?.map((subtask) => {
                        if (subtask.linkedTaskId) {
                            const linkedTask = lists
                                .flatMap((l) => l.tasks)
                                .find((t) => t.id === subtask.linkedTaskId);
                            if (linkedTask) {
                                const updatedLinkedTask = addActivityLogEntry(
                                    linkedTask,
                                    "subtask_linked",
                                    `Linked as subtask "${subtask.title}" in new task "${task.title}"`
                                );
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
    }, [activeGroup, lists, saveTask, setLists, setIsDialogOpen, setSelectedTask, setError, getFreshToken]);

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