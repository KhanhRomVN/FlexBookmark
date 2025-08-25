// src/presentation/tab/TaskManager/useTaskManager.ts
// Enhanced version with proper startDate/endDate range filtering

import { startTransition, useCallback, useMemo, useState, useEffect } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useAuth } from "./hooks/useAuth";
import { useTaskGroups } from "./hooks/useTaskGroups";
import { useTaskState } from "./hooks/useTaskState";
import { useTaskOperations } from "./hooks/useTaskOperations";
import { useTaskFilters } from "./hooks/useTaskFilters";
import { useTaskHelpers } from "./hooks/useTaskHelpers";
import { usePerformance } from "./hooks/usePerformance";
import { fetchGoogleTasks } from "../../../utils/GGTask";
import type { Task, Status } from "../../types/task";

export const folders = [
    { id: "backlog", title: "Backlog", emoji: "📥", priority: 1 },
    { id: "todo", title: "To Do", emoji: "📋", priority: 2 },
    { id: "in-progress", title: "In Progress", emoji: "🚧", priority: 3 },
    { id: "overdue", title: "Overdue", emoji: "⏰", priority: 4 },
    { id: "done", title: "Done", emoji: "✅", priority: 0 },
    { id: "archive", title: "Archive", emoji: "🗄️", priority: -1 },
];

// Virtual scrolling constants
const VIRTUAL_ITEM_HEIGHT = 120;
const OVERSCAN = 5;

// Helper function to safely convert values to strings for comparison
const safeStringify = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return String(value);
};

// Helper function for safe case-insensitive string matching
const safeStringMatch = (text: string, searchTerm: string): boolean => {
    try {
        const safeText = safeStringify(text).toLowerCase();
        const safeTerm = safeStringify(searchTerm).toLowerCase();
        return safeText.includes(safeTerm);
    } catch (error) {
        console.warn('Error in string matching:', error);
        return false;
    }
};

// Helper function to extract and validate dates from a task
const getTaskDates = (task: Task): Date[] => {
    const dates: Date[] = [];

    // Define date fields to check
    const dateFields = [
        'startDate', 'startTime', 'dueDate', 'dueTime',
        'actualStartDate', 'actualStartTime', 'actualEndDate', 'actualEndTime',
        'createdAt', 'updatedAt'
    ];

    dateFields.forEach(field => {
        const dateValue = task[field as keyof Task];
        if (dateValue) {
            try {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                    dates.push(parsedDate);
                }
            } catch (error) {
                console.warn(`Invalid date in field ${field}:`, dateValue);
            }
        }
    });

    return dates;
};

// Enhanced date range filter function
const isTaskInDateRange = (
    task: Task,
    filterStartTime: Date | null,
    filterEndTime: Date | null
): boolean => {
    if (!filterStartTime && !filterEndTime) return true;

    const taskDates = getTaskDates(task);

    // If task has no valid dates, exclude it from date-filtered results
    if (taskDates.length === 0) {
        return false;
    }

    // Check if any task date falls within the specified range
    return taskDates.some(taskDate => {
        // Check start time constraint
        if (filterStartTime && taskDate < filterStartTime) {
            return false;
        }

        // Check end time constraint
        if (filterEndTime && taskDate > filterEndTime) {
            return false;
        }

        return true;
    });
};

export function useTaskManager() {
    // Performance monitoring
    const { performanceMonitor } = usePerformance();

    // Auth state
    const { authState } = useAuth();

    // Task groups
    const { groups, activeGroup, setActiveGroup } = useTaskGroups();

    // Task state and UI state
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

    // Enhanced filter states
    const [filterCollection, setFilterCollection] = useState<string[]>([]);
    const [filterLocation, setFilterLocation] = useState<string>("");

    // ENHANCED: Separate start and end time filters for better UX
    const [filterStartTime, setFilterStartTime] = useState<Date | null>(null);
    const [filterEndTime, setFilterEndTime] = useState<Date | null>(null);

    // Additional filter options for different date types
    const [dateFilterMode, setDateFilterMode] = useState<'any' | 'start' | 'due' | 'actual' | 'created'>('any');

    // Task operations
    const {
        saveTask,
        loadTasks: originalLoadTasks,
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
        setIsDialogOpen
    );

    // Task helpers
    const {
        addActivityLogEntry,
        createInitialActivityLog,
    } = useTaskHelpers();

    // Task filters with enhanced filtering
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
        getFilteredLists: originalGetFilteredLists,
    } = useTaskFilters();

    // Virtual scrolling state
    const [virtualScrollOffset, setVirtualScrollOffset] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    // Enhanced loadTasks function
    const loadTasks = useCallback(async () => {
        if (!authState.user?.accessToken || !activeGroup) {
            console.warn('Cannot load tasks: missing auth or active group');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Get fresh token
            const token = await new Promise<string>((resolve, reject) => {
                if (typeof chrome !== "undefined" && chrome.identity) {
                    chrome.identity.getAuthToken(
                        {
                            interactive: false,
                            scopes: [
                                "openid",
                                "email",
                                "profile",
                                "https://www.googleapis.com/auth/tasks",
                                "https://www.googleapis.com/auth/tasks.readonly",
                            ],
                        },
                        (result) => {
                            if (result?.token) {
                                resolve(result.token);
                            } else {
                                reject(new Error("No token received"));
                            }
                        }
                    );
                } else {
                    resolve(authState.user.accessToken);
                }
            });

            // Fetch tasks for the active group
            const tasks = await fetchGoogleTasks(token, activeGroup);

            // Organize tasks into folder structure
            const organizedLists = folders.map(folder => ({
                id: folder.id,
                title: folder.title,
                emoji: folder.emoji,
                tasks: tasks.filter((task: Task) => task.status === folder.id)
            }));

            // Update lists with React transition
            startTransition(() => {
                setLists(organizedLists);
            });

        } catch (error: any) {
            console.error('Error loading tasks:', error);
            setError(error.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [authState.user?.accessToken, activeGroup, setLoading, setError, setLists]);

    // Load tasks when active group changes
    useEffect(() => {
        if (activeGroup && authState.user?.accessToken) {
            loadTasks();
        }
    }, [activeGroup, authState.user?.accessToken, loadTasks]);

    // ENHANCED: Advanced filtering function with improved date range logic
    const getEnhancedFilteredLists = useCallback((lists: any[]) => {
        return lists.map(list => ({
            ...list,
            tasks: list.tasks.filter((task: Task) => {
                // Apply basic filters manually to avoid the fuzzySearch issue
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
                if (filterPriority && filterPriority !== "all" && Array.isArray(filterPriority) && filterPriority.length > 0) {
                    if (!filterPriority.includes(task.priority)) {
                        return false;
                    }
                }

                // Status filter
                if (filterStatus && filterStatus !== "all") {
                    if (task.status !== filterStatus) {
                        return false;
                    }
                }

                // Apply collection filter
                if (filterCollection.length > 0) {
                    const taskCollection = safeStringify(task.collection);
                    if (!filterCollection.some(collection =>
                        safeStringMatch(taskCollection, collection)
                    )) {
                        return false;
                    }
                }

                // Apply location filter
                if (filterLocation) {
                    const taskLocationName = safeStringify(task.locationName);
                    if (!safeStringMatch(taskLocationName, filterLocation)) {
                        return false;
                    }
                }

                // Apply tags filter with safe string handling
                if (filterTags && Array.isArray(filterTags) && filterTags.length > 0) {
                    const taskTags = task.tags || [];

                    if (!Array.isArray(taskTags)) {
                        console.warn('Task tags is not an array:', taskTags);
                        return false;
                    }

                    const safeTaskTags = taskTags.map(tag => safeStringify(tag)).filter(tag => tag.length > 0);

                    const hasMatchingTag = filterTags.some(filterTag => {
                        const safeFilterTag = safeStringify(filterTag);

                        if (!safeFilterTag) {
                            console.warn('Filter tag is empty after stringification:', filterTag);
                            return false;
                        }

                        return safeTaskTags.some(taskTag => {
                            return safeStringMatch(taskTag, safeFilterTag) ||
                                safeStringMatch(safeFilterTag, taskTag);
                        });
                    });

                    if (!hasMatchingTag) {
                        return false;
                    }
                }

                // ENHANCED: Apply date/time range filter with mode-specific logic
                if (filterStartTime || filterEndTime) {
                    let relevantDates: Date[] = [];

                    // Get dates based on filter mode
                    switch (dateFilterMode) {
                        case 'start':
                            // Only check start dates
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
                            // Only check due dates
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
                            // Only check actual completion dates
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
                            // Only check creation/update dates
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
                            // Check all available dates
                            relevantDates = getTaskDates(task);
                            break;
                    }

                    // If no relevant dates found, exclude the task
                    if (relevantDates.length === 0) {
                        return false;
                    }

                    // Check if any relevant date falls within the range
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

                    if (!isInRange) {
                        return false;
                    }
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

    // Enhanced drag and drop handler
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
                // Reordering within same list
                const reordered = arrayMove(source.tasks, itemIndex, itemIndex);
                startTransition(() => {
                    setLists(prev =>
                        prev.map((l, idx) =>
                            idx === fromIndex ? { ...l, tasks: reordered } : l
                        )
                    );
                });
            } else {
                // Moving between lists
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
    }, [lists, saveTask, performanceMonitor, addActivityLogEntry, setLists]);

    // Task click handler
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
    }, [setSelectedTask, setIsDialogOpen, createInitialActivityLog]);

    // Enhanced handlers for individual tasks
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
    }, [lists, saveTask, addActivityLogEntry, setLists]);

    // Folder operations
    const handleCopyTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder) return;
        await handleBatchOperations.copyTasks(folder.tasks);
    }, [lists, handleBatchOperations]);

    const handleMoveTasks = useCallback(async (fromFolderId: string, toFolderId: string) => {
        const fromFolder = lists.find(l => l.id === fromFolderId);
        if (!fromFolder) return;
        await handleBatchOperations.moveTasks(fromFolder.tasks, toFolderId as Status);
    }, [lists, handleBatchOperations]);

    const handleArchiveTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder) return;
        await handleBatchOperations.archiveTasks(folder.tasks);
    }, [lists, handleBatchOperations]);

    const handleDeleteTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder || !authState.user || !activeGroup) return;

        if (!window.confirm(`Are you sure you want to delete all ${folder.tasks.length} tasks in ${folder.title}? This action cannot be undone.`)) {
            return;
        }

        const taskIds = folder.tasks.map(task => task.id);
        await handleBatchOperations.deleteMultiple(taskIds);
    }, [lists, authState, activeGroup, handleBatchOperations]);

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

    // Enhanced filtered lists using the new filtering logic
    const filteredLists = useMemo(() => {
        return getEnhancedFilteredLists(lists);
    }, [lists, getEnhancedFilteredLists]);

    // Virtual scrolling helpers
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

    // Statistics
    const statistics = useMemo(() => {
        const totalTasks = lists.filter(l => l.id !== 'archive').reduce((sum, l) => sum + l.tasks.length, 0);
        const completedTasks = lists.find(l => l.id === "done")?.tasks.length ?? 0;
        const overdueTasks = lists.find(l => l.id === "overdue")?.tasks.length ?? 0;
        const urgentTasks = lists.filter(l => l.id !== 'archive').reduce(
            (sum, l) => sum + l.tasks.filter(t => t.priority === "urgent").length,
            0
        );
        const archivedTasks = lists.find(l => l.id === "archive")?.tasks ?? [];
        const performanceStats = performanceMonitor.getStats();

        return {
            totalTasks,
            completedTasks,
            urgentTasks,
            overdueTasks,
            archivedTasks,
            performanceStats,
        };
    }, [lists, performanceMonitor]);

    // Create group handler - placeholder that should be implemented in parent
    const handleCreateGroup = useCallback(async (name: string) => {
        // This will be overridden in the parent component
        console.log('Creating group:', name);
    }, []);

    return {
        // Core state
        authState,
        groups,
        activeGroup,
        setActiveGroup,
        lists,
        filteredLists,
        loading,
        error,

        // Filter state
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

        // Enhanced filter states
        filterCollection,
        setFilterCollection,
        filterLocation,
        setFilterLocation,
        filterStartTime,
        setFilterStartTime,
        filterEndTime,
        setFilterEndTime,
        dateFilterMode,
        setDateFilterMode,

        // Quick add state
        quickAddStatus,
        setQuickAddStatus,
        quickAddTitle,
        setQuickAddTitle,

        // Dialog state
        selectedTask,
        isDialogOpen,
        setIsDialogOpen,
        setSelectedTask,

        // Archive drawer
        showArchiveDrawer,
        setShowArchiveDrawer,

        // Virtual scrolling
        virtualScrollOffset,
        setVirtualScrollOffset,
        containerHeight,
        setContainerHeight,
        calculateVirtualScrollData,

        // Core handlers
        handleDragEnd,
        handleQuickAddTask,
        handleTaskClick,
        handleCreateGroup,
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        handleSaveTaskDetail,

        // Folder operations
        handleCopyTasks,
        handleMoveTasks,
        handleArchiveTasks,
        handleDeleteTasks,
        handleSortTasks,

        // Individual task operations
        handleEditTask,
        handleMoveTask,
        handleCopyTask,
        handleArchiveTask,

        // Batch operations
        handleBatchOperations,

        // Utilities
        handleClearFilters,
        loadTasks,

        // Statistics
        ...statistics,

        // Performance monitoring
        performanceStats: statistics.performanceStats,

        // Expose state setters
        setLists,
        setError,
    };
}