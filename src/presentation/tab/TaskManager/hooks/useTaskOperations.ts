// src/presentation/tab/TaskManager/hooks/useTaskOperations.ts
import { useCallback, useRef } from "react";
import {
    fetchGoogleTasks,
    updateGoogleTask,
    createGoogleTask,
    deleteGoogleTask,
    verifyTokenScopes
} from "../../../../utils/GGTask";
import { useAuth } from "./useAuth";
import { useTaskGroups } from "./useTaskGroups";
import { useTaskState } from "./useTaskState";
import { useTaskHelpers } from "./useTaskHelpers";
import { AdvancedCache } from "./useCache";
import type { Task, Status } from "../../../types/task";
import { folders } from "../useTaskManager";

// Định nghĩa kiểu cho một danh sách (list)
interface TaskList {
    id: string;
    title: string;
    emoji: string;
    priority: number;
    tasks: Task[];
}

const cache = new AdvancedCache<Task[]>();

export function useTaskOperations() {
    const { authState, getFreshToken } = useAuth();
    const { activeGroup } = useTaskGroups();
    const {
        lists,
        setLists,
        setError,
        setLoading,
        addActivityLogEntry,
        createInitialActivityLog
    } = useTaskState();
    const { determineTaskStatus, checkAndMoveOverdueTasks } = useTaskHelpers();
    const abortController = useRef<AbortController | null>(null);

    const saveTask = useCallback(async (task: Task) => {
        if (!authState.user || !activeGroup) return;

        try {
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }

            if (task.id) {
                const smartStatus = determineTaskStatus(task);
                const finalTask = { ...task, status: smartStatus };
                await updateGoogleTask(token, task.id, finalTask, activeGroup);
            } else {
                const smartStatus = determineTaskStatus(task);
                const newTask = { ...task, status: smartStatus };
                await createGoogleTask(token, newTask, activeGroup);
            }

            cache.clear();
        } catch (err) {
            console.error("Failed to save task:", err);
            setError("Failed to save task.");
        }
    }, [authState, activeGroup, getFreshToken, determineTaskStatus]);

    const handleDeleteTask = useCallback(async (taskId: string) => {
        if (!authState.user || !activeGroup) return;

        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            await deleteGoogleTask(token, taskId, activeGroup);

            setLists(prev =>
                prev.map(l => ({
                    ...l,
                    tasks: l.tasks.filter(t => t.id !== taskId)
                }))
            );

            cache.clear();
        } catch (err) {
            console.error("Failed to delete task:", err);
            setError("Failed to delete task.");
        }
    }, [authState, activeGroup, getFreshToken, setLists]);

    const handleDuplicateTask = useCallback(async (task: Task) => {
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
            const taskWithActivityLog = {
                ...created,
                activityLog: created.activityLog || createInitialActivityLog()
            };

            setLists(prev => prev.map(l =>
                l.id === task.status
                    ? { ...l, tasks: [...l.tasks, taskWithActivityLog] }
                    : l
            ));

            cache.clear();
        } catch (err) {
            console.error("Failed to duplicate task:", err);
            setError("Failed to duplicate task.");
        }
    }, [authState, activeGroup, getFreshToken, createInitialActivityLog, setLists]);

    const handleMove = useCallback(async (taskId: string, newStatus: Status) => {
        const found = lists.flatMap(l => l.tasks).find(t => t.id === taskId);
        if (!found) return;

        const oldStatus = found.status;
        const updatedTask = addActivityLogEntry(
            { ...found, status: newStatus },
            "status_changed",
            `Status changed from "${folders.find(f => f.id === oldStatus)?.title}" to "${folders.find(f => f.id === newStatus)?.title}"`
        );

        setLists(prev =>
            prev.map(l => ({
                ...l,
                tasks: l.id === newStatus
                    ? [...l.tasks.filter(t => t.id !== taskId), updatedTask]
                    : l.tasks.filter(t => t.id !== taskId)
            }))
        );

        await saveTask(updatedTask);
    }, [lists, saveTask, setLists, addActivityLogEntry]);

    const handleQuickAddTask = useCallback(async () => {
        // Implementation similar to original
    }, [authState, activeGroup, getFreshToken, lists, setLists]);

    const loadTasks = useCallback(async (force = false) => {
        if (!authState.user || !activeGroup) return;

        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();

        const cacheKey = `tasks_${activeGroup}_${authState.user.email}`;
        if (!force && cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);
            if (cached) {
                const updated: TaskList[] = folders.map(f => ({
                    ...f,
                    tasks: cached.filter(t => t.status === f.id),
                }));
                setLists(updated);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }

            const tasks: Task[] = await fetchGoogleTasks(token, activeGroup);
            const processedTasks = checkAndMoveOverdueTasks(tasks).map(task => ({
                ...task,
                activityLog: task.activityLog || createInitialActivityLog()
            }));

            cache.set(cacheKey, processedTasks);
            const updatedLists: TaskList[] = folders.map(f => ({
                ...f,
                tasks: processedTasks.filter(t => t.status === f.id),
            }));
            setLists(updatedLists);
        } catch (err) {
            if (!abortController.current?.signal.aborted) {
                setError("Failed to load tasks.");
            }
        } finally {
            setLoading(false);
        }
    }, [authState, activeGroup, getFreshToken, setLists, setLoading, setError, checkAndMoveOverdueTasks, createInitialActivityLog]);

    return {
        saveTask,
        handleDeleteTask,
        handleDuplicateTask,
        handleMove,
        handleQuickAddTask,
        loadTasks,
        // Add other operations as needed
    };
}