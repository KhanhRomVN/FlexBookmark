// useTask.ts - Simplified version using centralized auth
import { useState, useEffect, useCallback, useMemo, startTransition } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task, Status } from "../types/task";
import { fetchGoogleTasks } from "../services/GoogleTaskService";

// Import custom hooks
import { useTaskGroups } from "./useTaskGroups";
import { useTaskState, folders } from "./useTaskState";
import { useTaskOperations } from "./useTaskOperations";
import { useTaskFilters } from "./useTaskFilters";
import { useAuth } from "@/contexts/AuthContext"; // Use centralized auth

// Import helper functions
import {
    addActivityLogEntry,
    createInitialActivityLog,
    getTaskDates,
    safeStringify,
    safeStringMatch
} from "../utils/taskUtils";

// Constants
const VIRTUAL_ITEM_HEIGHT = 120;
const OVERSCAN = 5;

// Performance monitoring hook
function usePerformance() {
    const performanceMonitor = useMemo(() => ({
        startTimer: (operation: string) => {
            const start = performance.now();
            return () => {
                const duration = performance.now() - start;
                console.log(`${operation}: ${duration.toFixed(2)}ms`);
            };
        }
    }), []);

    return { performanceMonitor };
}

export function useTask() {
    const { authState, getFreshToken } = useAuth(); // Use centralized auth directly
    const { performanceMonitor } = usePerformance();

    // Core hooks
    const { groups, activeGroup, setActiveGroup } = useTaskGroups();

    // State management
    const {
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
    } = useTaskState();

    // Task operations - pass centralized auth
    const {
        saveTask,
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        handleQuickAddTask,
        handleSaveTaskDetail,
        handleBatchOperations,
    } = useTaskOperations(
        lists,
        setLists,
        setError,
        setLoading,
        quickAddTitle,
        setQuickAddTitle,
        setQuickAddStatus,
        selectedTask,
        setSelectedTask,
        setIsDialogOpen,
        getFreshToken // Pass getFreshToken instead of authState
    );

    // Filtering and sorting
    const {
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
        dateRange,
        setDateRange,
        handleClearFilters: originalHandleClearFilters,
        sortTasks,
    } = useTaskFilters();

    // Additional filter states
    const [filterCollection, setFilterCollection] = useState<string[]>([]);
    const [filterLocation, setFilterLocation] = useState<string>("");
    const [filterStartTime, setFilterStartTime] = useState<Date | null>(null);
    const [filterEndTime, setFilterEndTime] = useState<Date | null>(null);
    const [dateFilterMode, setDateFilterMode] = useState<'any' | 'start' | 'due' | 'actual' | 'created'>('any');

    // Virtual scrolling states
    const [virtualScrollOffset, setVirtualScrollOffset] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    // Enhanced load tasks function using centralized auth
    const loadTasks = useCallback(async (_force = false) => {
        if (!authState.isAuthenticated || !activeGroup) {
            console.warn('Cannot load tasks: missing auth or active group');
            return;
        }

        const endTimer = performanceMonitor.startTimer('loadTasks');

        try {
            setLoading(true);
            setError(null);

            // Get fresh token from centralized auth
            const token = await getFreshToken();
            const tasks = await fetchGoogleTasks(token, activeGroup);

            // Organize tasks into lists
            const organizedLists = folders.map(folder => ({
                id: folder.id,
                title: folder.title,
                emoji: folder.emoji,
                priority: folder.priority,
                tasks: tasks
                    .filter((task: Task) => task.status === folder.id)
                    .map((task: Task) => ({
                        ...task,
                        activityLog: task.activityLog && task.activityLog.length > 0
                            ? task.activityLog
                            : createInitialActivityLog()
                    }))
            }));

            startTransition(() => {
                setLists(organizedLists);
            });

        } catch (error: any) {
            console.error('Error loading tasks:', error);
            setError(error.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
            endTimer();
        }
    }, [authState.isAuthenticated, activeGroup, setLoading, setError, setLists, performanceMonitor, getFreshToken]);

    // Load tasks when dependencies change
    useEffect(() => {
        if (activeGroup && authState.isAuthenticated) {
            loadTasks();
        }
    }, [activeGroup, authState.isAuthenticated, loadTasks]);

    // Enhanced filter function
    const getEnhancedFilteredLists = useCallback((lists: any[]) => {
        return lists.map(list => ({
            ...list,
            tasks: list.tasks.filter((task: Task) => {
                // Search term filter
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    const matchesSearch = [
                        task.title,
                        task.description,
                        ...(task.tags || [])
                    ].some(field =>
                        field && safeStringify(field).toLowerCase().includes(searchLower)
                    );
                    if (!matchesSearch) return false;
                }

                // Priority filter
                if (filterPriority && filterPriority !== "all") {
                    if (Array.isArray(filterPriority) && filterPriority.length > 0) {
                        if (!filterPriority.includes(task.priority)) {
                            return false;
                        }
                    } else if (task.priority !== filterPriority) {
                        return false;
                    }
                }

                // Status filter
                if (filterStatus && filterStatus !== "all" && task.status !== filterStatus) {
                    return false;
                }

                // Collection filter
                if (filterCollection.length > 0) {
                    const taskCollection = safeStringify(task.collection);
                    if (!filterCollection.some(collection =>
                        safeStringMatch(taskCollection, collection)
                    )) {
                        return false;
                    }
                }

                // Location filter
                if (filterLocation) {
                    const taskLocationName = safeStringify(task.locationName);
                    if (!safeStringMatch(taskLocationName, filterLocation)) {
                        return false;
                    }
                }

                // Tags filter
                if (filterTags && Array.isArray(filterTags) && filterTags.length > 0) {
                    const taskTags = Array.isArray(task.tags) ? task.tags : [];
                    const safeTaskTags = taskTags.map(tag => safeStringify(tag)).filter(tag => tag.length > 0);

                    const hasMatchingTag = filterTags.some(filterTag => {
                        const safeFilterTag = safeStringify(filterTag);
                        if (!safeFilterTag) return false;

                        return safeTaskTags.some(taskTag => {
                            return safeStringMatch(taskTag, safeFilterTag) ||
                                safeStringMatch(safeFilterTag, taskTag);
                        });
                    });

                    if (!hasMatchingTag) return false;
                }

                // Date range filter
                if (filterStartTime || filterEndTime) {
                    let relevantDates: Date[] = [];

                    switch (dateFilterMode) {
                        case 'start':
                            [task.startDate, task.startTime, task.actualStartDate, task.actualStartTime]
                                .forEach(date => {
                                    if (date) {
                                        try {
                                            const parsedDate = new Date(date);
                                            if (!isNaN(parsedDate.getTime())) {
                                                relevantDates.push(parsedDate);
                                            }
                                        } catch (e) {
                                            console.warn('Invalid start date:', date);
                                        }
                                    }
                                });
                            break;

                        case 'due':
                            [task.dueDate, task.dueTime].forEach(date => {
                                if (date) {
                                    try {
                                        const parsedDate = new Date(date);
                                        if (!isNaN(parsedDate.getTime())) {
                                            relevantDates.push(parsedDate);
                                        }
                                    } catch (e) {
                                        console.warn('Invalid due date:', date);
                                    }
                                }
                            });
                            break;

                        case 'actual':
                            [task.actualStartDate, task.actualStartTime, task.actualEndDate, task.actualEndTime]
                                .forEach(date => {
                                    if (date) {
                                        try {
                                            const parsedDate = new Date(date);
                                            if (!isNaN(parsedDate.getTime())) {
                                                relevantDates.push(parsedDate);
                                            }
                                        } catch (e) {
                                            console.warn('Invalid actual date:', date);
                                        }
                                    }
                                });
                            break;

                        case 'created':
                            [task.createdAt, task.updatedAt].forEach(date => {
                                if (date) {
                                    try {
                                        const parsedDate = new Date(date);
                                        if (!isNaN(parsedDate.getTime())) {
                                            relevantDates.push(parsedDate);
                                        }
                                    } catch (e) {
                                        console.warn('Invalid created date:', date);
                                    }
                                }
                            });
                            break;

                        case 'any':
                        default:
                            relevantDates = getTaskDates(task);
                            break;
                    }

                    if (relevantDates.length === 0) return false;

                    const isInRange = relevantDates.some(taskDate => {
                        let withinRange = true;

                        if (filterStartTime) {
                            withinRange = withinRange && taskDate >= filterStartTime;
                        }

                        if (filterEndTime) {
                            withinRange = withinRange && taskDate <= filterEndTime;
                        }

                        return withinRange;
                    });

                    if (!isInRange) return false;
                }

                return true;
            })
        }));
    }, [
        searchTerm, filterPriority, filterStatus, filterTags,
        filterCollection, filterLocation, filterStartTime, filterEndTime,
        dateFilterMode
    ]);

    // Enhanced clear filters function
    const handleClearFilters = useCallback(() => {
        originalHandleClearFilters();
        setFilterCollection([]);
        setFilterLocation("");
        setFilterStartTime(null);
        setFilterEndTime(null);
        setDateFilterMode('any');
    }, [originalHandleClearFilters]);

    // Drag and drop handler
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const endTimer = performanceMonitor.startTimer('dragEnd');
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const fromIndex = lists.findIndex(l =>
                l.tasks.some(t => t.id === active.id)
            );
            const toIndex = lists.findIndex(
                l => l.tasks.some(t => t.id === over.id) || l.id === over.id
            );

            if (fromIndex === -1 || toIndex === -1) {
                endTimer();
                return;
            }

            const source = lists[fromIndex];
            const dest = lists[toIndex];
            const itemIndex = source.tasks.findIndex(t => t.id === active.id);

            if (fromIndex === toIndex) {
                // Reorder within the same list
                const reordered = arrayMove(source.tasks, itemIndex, itemIndex);
                startTransition(() => {
                    setLists(prev =>
                        prev.map((l, idx) =>
                            idx === fromIndex ? { ...l, tasks: reordered } : l
                        )
                    );
                });
            } else {
                // Move between lists
                const moved = source.tasks[itemIndex];
                const oldStatus = moved.status;
                const newStatus = dest.id as Status;

                const updatedTask = addActivityLogEntry(
                    { ...moved, status: newStatus },
                    "status_changed",
                    `Status changed from "${folders.find(f => f.id === oldStatus)?.title}" to "${folders.find(f => f.id === newStatus)?.title}"`
                );

                startTransition(() => {
                    setLists(prev =>
                        prev.map((l, idx) => {
                            if (idx === fromIndex) {
                                return { ...l, tasks: l.tasks.filter(t => t.id !== active.id) };
                            }
                            if (idx === toIndex) {
                                return { ...l, tasks: [...l.tasks, updatedTask] };
                            }
                            return l;
                        })
                    );
                });

                saveTask(updatedTask);
            }
        }
        endTimer();
    }, [lists, saveTask, performanceMonitor, setLists]);

    // Task interaction handlers
    const handleTaskClick = useCallback((task: Task) => {
        const taskWithActivityLog = {
            ...task,
            activityLog: task.activityLog && task.activityLog.length > 0
                ? task.activityLog
                : createInitialActivityLog()
        };

        startTransition(() => {
            setSelectedTask(taskWithActivityLog);
            setIsDialogOpen(true);
        });
    }, [setSelectedTask, setIsDialogOpen]);

    const handleEditTask = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    }, [setSelectedTask, setIsDialogOpen]);

    const handleMoveTask = useCallback((taskId: string, targetStatus: string) => {
        handleMove(taskId, targetStatus as Status);
    }, [handleMove]);

    const handleCopyTask = useCallback(async (task: Task) => {
        await handleDuplicateTask(task);
    }, [handleDuplicateTask]);

    const handleArchiveTask = useCallback(async (taskId: string) => {
        const task = lists.flatMap(l => l.tasks).find(t => t.id === taskId);
        if (!task) return;

        const archivedTask = addActivityLogEntry(
            { ...task, status: "archive" },
            "archived",
            "Task archived"
        );

        startTransition(() => {
            setLists(prev => prev.map(l => ({
                ...l,
                tasks: l.id === "archive"
                    ? [...l.tasks, archivedTask]
                    : l.tasks.filter(t => t.id !== taskId)
            })));
        });

        await saveTask(archivedTask);
    }, [lists, saveTask, setLists]);

    // Batch operations
    const handleArchiveTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder) return;
        await handleBatchOperations.archiveTasks(folder.tasks);
    }, [lists, handleBatchOperations]);

    const handleDeleteTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder || !activeGroup) return;

        if (!window.confirm(`Are you sure you want to delete all ${folder.tasks.length} tasks in ${folder.title}? This action cannot be undone.`)) {
            return;
        }

        const taskIds = folder.tasks.map(task => task.id);
        await handleBatchOperations.deleteMultiple(taskIds);
    }, [lists, activeGroup, handleBatchOperations]);

    const handleSortTasks = useCallback((folderId: string, sortType: string) => {
        startTransition(() => {
            setLists(prev =>
                prev.map(l =>
                    l.id === folderId
                        ? { ...l, tasks: sortTasks(l.tasks, sortType, sortOrder) }
                        : l
                )
            );
        });
    }, [sortTasks, sortOrder, setLists]);

    const handleCreateGroup = useCallback(async (name: string) => {
        console.log('Creating group:', name);
        // Implementation would go here
    }, []);

    // Virtual scrolling calculations
    const calculateVirtualScrollData = useCallback((tasks: Task[]) => {
        const totalHeight = tasks.length * VIRTUAL_ITEM_HEIGHT;
        const visibleCount = Math.ceil(containerHeight / VIRTUAL_ITEM_HEIGHT);
        const startIndex = Math.floor(virtualScrollOffset / VIRTUAL_ITEM_HEIGHT);
        const endIndex = Math.min(startIndex + visibleCount + OVERSCAN, tasks.length);

        return {
            totalHeight,
            visibleCount,
            startIndex,
            endIndex,
            visibleTasks: tasks.slice(startIndex, endIndex)
        };
    }, [containerHeight, virtualScrollOffset]);

    // Filtered lists memoization
    const filteredLists = useMemo(() => {
        return getEnhancedFilteredLists(lists);
    }, [lists, getEnhancedFilteredLists]);

    // Task statistics
    const taskStats = useMemo(() => {
        const allTasks = lists.flatMap(l => l.tasks);
        return {
            totalTasks: allTasks.length,
            completedTasks: allTasks.filter(t => t.status === 'done').length,
            urgentTasks: allTasks.filter(t => t.priority === 'urgent').length,
            overdueTasks: allTasks.filter(t => t.status === 'overdue').length,
        };
    }, [lists]);

    // Archived tasks calculation
    const archivedTasks = useMemo(() => {
        const archiveList = lists.find(l => l.id === 'archive');
        return archiveList ? archiveList.tasks : [];
    }, [lists]);

    return {
        // Auth & Groups - now using centralized auth
        authState,
        groups,
        activeGroup,
        setActiveGroup,

        // State
        lists,
        filteredLists,
        loading,
        error,
        selectedTask,
        isDialogOpen,
        setIsDialogOpen,
        setSelectedTask,
        showArchiveDrawer,
        setShowArchiveDrawer,

        // Filtering & Sorting
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
        dateRange,
        setDateRange,
        filterCollection,
        setFilterCollection,
        filterLocation,
        setFilterLocation,
        filterStartTime,
        setFilterStartTime,
        filterEndTime,
        setFilterEndTime,
        filterTimeRange: {
            start: filterStartTime,
            end: filterEndTime,
        },
        setFilterTimeRange: useCallback((timeRange: { start?: Date | null; end?: Date | null }) => {
            if (timeRange.start !== undefined) setFilterStartTime(timeRange.start);
            if (timeRange.end !== undefined) setFilterEndTime(timeRange.end);
        }, []),
        dateFilterMode,
        setDateFilterMode,
        handleClearFilters,

        // Quick Add
        quickAddStatus,
        setQuickAddStatus,
        quickAddTitle,
        setQuickAddTitle,

        // Virtual Scrolling
        virtualScrollOffset,
        setVirtualScrollOffset,
        containerHeight,
        setContainerHeight,
        calculateVirtualScrollData,

        // Task Operations
        loadTasks,
        handleQuickAddTask,
        handleTaskClick,
        handleEditTask,
        handleMoveTask,
        handleCopyTask,
        handleArchiveTask,
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        handleSaveTaskDetail,
        handleBatchOperations,

        // Batch Operations
        handleArchiveTasks,
        handleDeleteTasks,
        handleSortTasks,

        // Drag & Drop
        handleDragEnd,

        // Group Management
        handleCreateGroup,

        // Statistics
        ...taskStats,
        archivedTasks,

        // Utilities
        setLists,
        setError,
    };
}

export { folders };