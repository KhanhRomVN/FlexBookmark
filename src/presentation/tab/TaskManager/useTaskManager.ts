// src/presentation/tab/TaskManager/useTaskManager.ts
import { useCallback, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useAuth } from "./hooks/useAuth";
import { useTaskGroups } from "./hooks/useTaskGroups";
import { useTaskState } from "./hooks/useTaskState";
import { useTaskOperations } from "./hooks/useTaskOperations";
import { useTaskFilters } from "./hooks/useTaskFilters";
import { useTaskHelpers } from "./hooks/useTaskHelpers";
import { usePerformance } from "./hooks/usePerformance";
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
        error,
        quickAddStatus,
        setQuickAddStatus,
        quickAddTitle,
        setQuickAddTitle,
        showArchiveDrawer,
        setShowArchiveDrawer,
    } = useTaskState();

    // Task operations
    const {
        saveTask,
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        handleQuickAddTask,
        loadTasks,
        handleBatchOperations,
    } = useTaskOperations();

    // Task filters
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
        handleClearFilters,
    } = useTaskFilters();

    // Task helpers
    const { determineTaskStatus } = useTaskHelpers();

    // Virtual scrolling state
    const [virtualScrollOffset, setVirtualScrollOffset] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    // Enhanced drag and drop
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

            if (fromIndex === -1 || toIndex === -1) return;

            const source = lists[fromIndex];
            const dest = lists[toIndex];
            const itemIndex = source.tasks.findIndex(t => t.id === active.id);

            if (fromIndex === toIndex) {
                const reordered = arrayMove(source.tasks, itemIndex, itemIndex);
                setLists(prev =>
                    prev.map((l, idx) =>
                        idx === fromIndex ? { ...l, tasks: reordered } : l
                    )
                );
            } else {
                const moved = source.tasks[itemIndex];
                const oldStatus = moved.status;
                const newStatus = dest.id as Status;

                const updatedTask = {
                    ...moved,
                    status: newStatus,
                };

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

                saveTask(updatedTask);
            }
        }
        endTimer();
    }, [lists, saveTask, performanceMonitor]);

    // Task click handler
    const handleTaskClick = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    }, [setSelectedTask, setIsDialogOpen]);

    // Enhanced handlers for individual tasks
    const handleEditTask = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    }, [setSelectedTask, setIsDialogOpen]);

    const handleMoveTask = useCallback((taskId: string, targetStatus: string) => {
        handleMove(taskId, targetStatus as Status);
    }, [handleMove]);

    const handleCopyTask = useCallback((task: Task) => {
        handleDuplicateTask(task);
    }, [handleDuplicateTask]);

    const handleArchiveTask = useCallback((taskId: string) => {
        handleMove(taskId, 'archive' as Status);
    }, [handleMove]);

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
        if (!folder) return;
        await handleBatchOperations.deleteMultiple(
            folder.tasks.map(task => task.id)
        );
    }, [lists, handleBatchOperations]);

    // Sorting function
    const sortTasks = useCallback((tasks: Task[], sortType: string, order: 'asc' | 'desc'): Task[] => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

        return [...tasks].sort((a, b) => {
            switch (sortType) {
                case "priority-high":
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case "priority-low":
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case "due-date-asc":
                    return (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity);
                case "due-date-desc":
                    return (b.dueDate?.getTime() || 0) - (a.dueDate?.getTime() || 0);
                case "title-asc":
                    return a.title.localeCompare(b.title);
                case "title-desc":
                    return b.title.localeCompare(a.title);
                case "created-asc":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "created-desc":
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    }, []);

    const handleSortTasks = useCallback((folderId: string, sortType: string) => {
        setLists(prev =>
            prev.map(l =>
                l.id === folderId
                    ? { ...l, tasks: sortTasks(l.tasks, sortType, sortOrder) }
                    : l
            )
        );
    }, [sortTasks, sortOrder]);

    // Filtered and sorted lists
    const filteredLists = useMemo(() => {
        return lists.map(l => ({
            ...l,
            tasks: l.tasks
                .filter(task => {
                    const matchesSearch = searchTerm === '' ||
                        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (task.description?.toLowerCase().includes(searchTerm.toLowerCase()));

                    const matchesPriority = filterPriority === "all" ||
                        task.priority === filterPriority;

                    const matchesStatus = filterStatus === "all" ||
                        task.status === filterStatus;

                    const matchesTags = filterTags === "" ||
                        task.tags?.some(tag =>
                            tag.toLowerCase().includes(filterTags.toLowerCase()));

                    let matchesDateRange = true;
                    if (dateRange.start || dateRange.end) {
                        const taskDate = task.dueDate || task.startDate;
                        if (taskDate) {
                            if (dateRange.start && taskDate < dateRange.start) {
                                matchesDateRange = false;
                            }
                            if (dateRange.end && taskDate > dateRange.end) {
                                matchesDateRange = false;
                            }
                        }
                    }

                    return matchesSearch && matchesPriority && matchesStatus &&
                        matchesTags && matchesDateRange;
                })
                .sort((a, b) => sortTasks([a, b], sortBy, sortOrder)[0] === a ? -1 : 1)
        }));
    }, [lists, searchTerm, filterPriority, filterStatus, filterTags, dateRange, sortBy, sortOrder, sortTasks]);

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
        const totalTasks = lists.reduce((sum, l) => sum + l.tasks.length, 0);
        const completedTasks = lists.find(l => l.id === "done")?.tasks.length || 0;
        const overdueTasks = lists.find(l => l.id === "overdue")?.tasks.length || 0;
        const urgentTasks = lists.reduce(
            (sum, l) => sum + l.tasks.filter(t => t.priority === "urgent").length,
            0
        );
        const archivedTasks = lists.find(l => l.id === "archive")?.tasks || [];

        return {
            totalTasks,
            completedTasks,
            urgentTasks,
            overdueTasks,
            archivedTasks,
        };
    }, [lists]);

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
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        saveTask,

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
    };
}