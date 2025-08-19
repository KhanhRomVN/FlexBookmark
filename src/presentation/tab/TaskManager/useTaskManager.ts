// src/presentation/tab/TaskManager/useTaskManager.ts
import { startTransition, useCallback, useMemo, useState, useRef } from "react";
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
    const { authState, getFreshToken } = useAuth();

    // Task groups with destructured management functions
    const {
        groups,
        activeGroup,
        setActiveGroup,
        createGroup,
        deleteGroup,
        renameGroup,
        allGroups
    } = useTaskGroups();

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

    // Task operations
    const {
        saveTask,
        loadTasks,
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
        determineTaskStatus,
        addActivityLogEntry,
        createInitialActivityLog,
    } = useTaskHelpers();

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
        sortTasks,
        getFilteredLists,
    } = useTaskFilters();

    // Virtual scrolling state
    const [virtualScrollOffset, setVirtualScrollOffset] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    // Group management handlers
    const handleCreateGroup = useCallback(async (groupName: string, emoji?: string) => {
        try {
            console.log('Creating group:', groupName, emoji);
            await createGroup(groupName, emoji || '📁');
        } catch (error) {
            console.error('Failed to create group:', error);
            setError(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [createGroup, setError]);

    const handleDeleteGroup = useCallback(async (groupId: string) => {
        try {
            console.log('Deleting group:', groupId);

            // Find the group to get its title for confirmation
            const group = allGroups.find((g: { id: string; }) => g.id === groupId);
            if (!group) {
                console.error('Group not found:', groupId);
                return;
            }

            // Find tasks that use this group
            const affectedTasks = lists.flatMap(list => list.tasks).filter(task => task.group === group.title);

            if (affectedTasks.length > 0) {
                const confirmed = window.confirm(
                    `Are you sure you want to delete the group "${group.title}"? This will remove the group from ${affectedTasks.length} task(s), but the tasks themselves will not be deleted.`
                );

                if (!confirmed) {
                    return;
                }

                // Update all affected tasks to remove the group
                const updatedTasks = affectedTasks.map(task => ({
                    ...task,
                    group: '', // Remove group assignment
                }));

                // Update the lists state
                startTransition(() => {
                    setLists(prev => prev.map(list => ({
                        ...list,
                        tasks: list.tasks.map(task =>
                            updatedTasks.find(updatedTask => updatedTask.id === task.id) || task
                        )
                    })));
                });

                // Save the updated tasks
                for (const task of updatedTasks) {
                    await saveTask(task);
                }
            }

            await deleteGroup(groupId);
        } catch (error) {
            console.error('Failed to delete group:', error);
            setError(`Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [deleteGroup, setError, allGroups, lists, setLists, saveTask]);

    const handleRenameGroup = useCallback(async (groupId: string, newName: string) => {
        try {
            console.log('Renaming group:', groupId, 'to:', newName);

            // Find the group to get its current title
            const group = allGroups.find((g: { id: string; }) => g.id === groupId);
            if (!group) {
                console.error('Group not found:', groupId);
                return;
            }

            const oldName = group.title;

            // Find tasks that use this group and update them
            const affectedTasks = lists.flatMap(list => list.tasks).filter(task => task.group === oldName);

            if (affectedTasks.length > 0) {
                const updatedTasks = affectedTasks.map(task => ({
                    ...task,
                    group: newName, // Update to new group name
                }));

                // Update the lists state
                startTransition(() => {
                    setLists(prev => prev.map(list => ({
                        ...list,
                        tasks: list.tasks.map(task =>
                            updatedTasks.find(updatedTask => updatedTask.id === task.id) || task
                        )
                    })));
                });

                // Save the updated tasks
                for (const task of updatedTasks) {
                    await saveTask(task);
                }
            }

            await renameGroup(groupId, newName);
        } catch (error) {
            console.error('Failed to rename group:', error);
            setError(`Failed to rename group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [renameGroup, setError, allGroups, lists, setLists, saveTask]);

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
    }, [lists, saveTask, performanceMonitor, addActivityLogEntry]);

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

    // Filtered lists using the hook
    const filteredLists = useMemo(() => {
        return getFilteredLists(lists);
    }, [lists, getFilteredLists]);

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
        setError,

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
        setLists,

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
        handleSaveTaskDetail,

        // Group management handlers - These were missing!
        handleCreateGroup,
        handleDeleteGroup,
        handleRenameGroup,
        allGroups,

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
    };
}