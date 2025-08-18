import { useState, useEffect, useMemo, useCallback, useRef, useTransition } from "react";
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

// Virtual scrolling and performance constants
const VIRTUAL_ITEM_HEIGHT = 120;
const OVERSCAN = 5;
const DEBOUNCE_DELAY = 300;
const BATCH_SIZE = 50;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Updated folders with priority weighting for smart ordering
export const folders = [
    { id: "backlog", title: "Backlog", emoji: "📥", priority: 1 },
    { id: "todo", title: "To Do", emoji: "📋", priority: 2 },
    { id: "in-progress", title: "In Progress", emoji: "🚧", priority: 3 },
    { id: "overdue", title: "Overdue", emoji: "⏰", priority: 4 },
    { id: "done", title: "Done", emoji: "✅", priority: 0 },
    { id: "archive", title: "Archive", emoji: "🗄️", priority: -1 },
];

interface TaskList {
    id: string;
    title: string;
    emoji: string;
    tasks: Task[];
    priority: number;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Advanced caching system with TTL and memory management
class AdvancedCache {
    private cache = new Map<string, CacheEntry<any>>();
    private maxSize = 100;

    set<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
        // Implement LRU eviction if cache is full
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

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Move to end for LRU
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
}

// Debounce utility with advanced options
function useAdvancedDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T {
    const { leading = false, trailing = true, maxWait } = options;
    const timeoutRef = useRef<NodeJS.Timeout>();
    const maxTimeoutRef = useRef<NodeJS.Timeout>();
    const lastCallTime = useRef<number>();
    const lastInvokeTime = useRef<number>(0);

    const debouncedCallback = useCallback((...args: any[]) => {
        const now = Date.now();
        const shouldInvoke = leading && !timeoutRef.current;
        lastCallTime.current = now;

        const invokeCallback = () => {
            lastInvokeTime.current = now;
            callback(...args);
        };

        const shouldInvokeNow = () => {
            if (maxWait && now - lastInvokeTime.current >= maxWait) {
                return true;
            }
            return false;
        };

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
        }

        if (shouldInvoke) {
            invokeCallback();
        }

        if (shouldInvokeNow()) {
            invokeCallback();
            return;
        }

        timeoutRef.current = setTimeout(() => {
            if (trailing && lastCallTime.current && now - lastCallTime.current >= delay) {
                invokeCallback();
            }
            timeoutRef.current = undefined;
        }, delay);

        if (maxWait && !maxTimeoutRef.current) {
            maxTimeoutRef.current = setTimeout(() => {
                invokeCallback();
                maxTimeoutRef.current = undefined;
            }, maxWait);
        }
    }, [callback, delay, leading, trailing, maxWait]) as T;

    return debouncedCallback;
}

// Advanced sorting algorithms with multiple criteria
const sortingAlgorithms = {
    quickSort: <T>(arr: T[], compareFn: (a: T, b: T) => number): T[] => {
        if (arr.length <= 1) return arr;

        const pivot = arr[Math.floor(arr.length / 2)];
        const left = arr.filter(x => compareFn(x, pivot) < 0);
        const right = arr.filter(x => compareFn(x, pivot) > 0);
        const middle = arr.filter(x => compareFn(x, pivot) === 0);

        return [
            ...sortingAlgorithms.quickSort(left, compareFn),
            ...middle,
            ...sortingAlgorithms.quickSort(right, compareFn)
        ];
    },

    multiCriteriaSort: (tasks: Task[], criteria: Array<{ key: keyof Task; order: 'asc' | 'desc' }>): Task[] => {
        return tasks.sort((a, b) => {
            for (const criterion of criteria) {
                const aVal = a[criterion.key];
                const bVal = b[criterion.key];

                // Handle null or undefined values
                if (aVal == null && bVal == null) continue;
                if (aVal == null) return criterion.order === 'desc' ? 1 : -1;
                if (bVal == null) return criterion.order === 'desc' ? -1 : 1;

                let comparison = 0;
                const aComp: any = aVal;
                const bComp: any = bVal;

                if (aComp < bComp) comparison = -1;
                else if (aComp > bComp) comparison = 1;

                if (comparison !== 0) {
                    return criterion.order === 'desc' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }
};

// Advanced filtering with fuzzy search
const advancedFilters = {
    fuzzySearch: (text: string, query: string, threshold: number = 0.6): boolean => {
        if (!query) return true;
        if (!text) return false;

        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();

        // Exact match
        if (textLower.includes(queryLower)) return true;

        // Levenshtein distance for fuzzy matching
        const distance = advancedFilters.levenshteinDistance(textLower, queryLower);
        const similarity = 1 - distance / Math.max(textLower.length, queryLower.length);

        return similarity >= threshold;
    },

    levenshteinDistance: (str1: string, str2: string): number => {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + cost
                );
            }
        }

        return matrix[str2.length][str1.length];
    },

    smartFilter: (tasks: Task[], filters: {
        searchTerm: string;
        priority: string;
        status: string;
        tags: string;
        dateRange?: { start?: Date; end?: Date };
        fuzzyThreshold?: number;
    }): Task[] => {
        return tasks.filter(task => {
            // Fuzzy search across multiple fields
            const searchFields = [
                task.title,
                task.description,
                ...(task.tags || [])
            ].join(' ');

            const matchesSearch = advancedFilters.fuzzySearch(
                searchFields,
                filters.searchTerm,
                filters.fuzzyThreshold || 0.6
            );

            const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
            const matchesStatus = filters.status === "all" || task.status === filters.status;

            const matchesTags = !filters.tags ||
                (task.tags?.some(tag =>
                    advancedFilters.fuzzySearch(tag, filters.tags, 0.7)
                ) ?? false);

            // Date range filtering
            let matchesDateRange = true;
            if (filters.dateRange?.start || filters.dateRange?.end) {
                const taskDate = task.dueDate || task.startDate;
                if (taskDate) {
                    if (filters.dateRange.start && taskDate < filters.dateRange.start) {
                        matchesDateRange = false;
                    }
                    if (filters.dateRange.end && taskDate > filters.dateRange.end) {
                        matchesDateRange = false;
                    }
                }
            }

            return matchesSearch && matchesPriority && matchesStatus && matchesTags && matchesDateRange;
        });
    }
};

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
            this.metrics.get(operation)!.push(duration);

            // Keep only last 100 measurements
            const measurements = this.metrics.get(operation)!;
            if (measurements.length > 100) {
                measurements.splice(0, measurements.length - 100);
            }
        };
    }

    getAverageTime(operation: string): number {
        const measurements = this.metrics.get(operation);
        if (!measurements || measurements.length === 0) return 0;

        const sum = measurements.reduce((a, b) => a + b, 0);
        return sum / measurements.length;
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

export function useTaskManager() {
    // Core state with optimizations
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

    // Enhanced filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterTags, setFilterTags] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("created-desc");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

    const [quickAddStatus, setQuickAddStatus] = useState<Status | null>(null);
    const [quickAddTitle, setQuickAddTitle] = useState("");
    const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);

    // Performance and optimization state
    const [isPending, startTransition] = useTransition();
    const cache = useRef(new AdvancedCache());
    const performanceMonitor = useRef(new PerformanceMonitor());
    const lastLoadTime = useRef<number>(0);
    const abortController = useRef<AbortController | null>(null);

    // Virtual scrolling state
    const [virtualScrollOffset, setVirtualScrollOffset] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    const authManager = ChromeAuthManager.getInstance();

    // Optimized token management with caching
    const getFreshToken = useCallback(async (): Promise<string> => {
        const cacheKey = 'fresh_token';
        const cached = cache.current.get<string>(cacheKey);
        if (cached) return cached;

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
            cache.current.set(cacheKey, user.accessToken, 30 * 60 * 1000); // 30 min cache
            return user.accessToken;
        } catch (error) {
            console.error("Failed to get fresh token:", error);
            throw error;
        }
    }, [authState.user?.accessToken, authManager]);

    // Optimized auth state subscription
    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState: any) => {
            startTransition(() => {
                setAuthState(newState);
            });
        });
        authManager.initialize();
        return unsubscribe;
    }, [authManager]);

    // Optimized group loading with caching
    const loadTaskGroups = useCallback(async () => {
        if (!authState.user) return;

        const cacheKey = `groups_${authState.user.email}`;
        const cached = cache.current.get<any[]>(cacheKey);
        if (cached) {
            setGroups(cached);
            if (cached.length && !activeGroup) setActiveGroup(cached[0].id);
            return;
        }

        try {
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }

            const groups = await fetchGoogleTaskGroups(token);
            cache.current.set(cacheKey, groups, 10 * 60 * 1000); // 10 min cache
            setGroups(groups);
            if (groups.length && !activeGroup) setActiveGroup(groups[0].id);
        } catch (err) {
            console.error("Failed to load task groups:", err);
            setError("Failed to load task groups.");
        }
    }, [authState, activeGroup, getFreshToken]);

    useEffect(() => {
        if (authState.isAuthenticated && authState.user?.accessToken) {
            loadTaskGroups();
        }
    }, [authState, loadTaskGroups]);

    // Advanced task status determination with performance optimization
    // Advanced task status determination with performance optimization
    const determineTaskStatus = useCallback((task: Task): Status => {
        const now = new Date();

        if (task.completed) return "done";
        if (!task.startDate && !task.startTime) return "backlog";

        let startDateTime: Date | null = null;
        let dueDateTime: Date | null = null; // Changed from endDateTime to dueDateTime

        // Optimized date handling for start time
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

        // Fixed: Use dueDate and dueTime instead of dueDate and dueTime for overdue checking
        if (task.dueDate && task.dueTime) {
            dueDateTime = new Date(
                task.dueDate.getFullYear(),
                task.dueDate.getMonth(),
                task.dueDate.getDate(),
                task.dueTime.getHours(),
                task.dueTime.getMinutes(),
                task.dueTime.getSeconds()
            );
        } else if (task.dueDate) {
            dueDateTime = new Date(task.dueDate);
        } else if (task.dueTime) {
            const today = new Date();
            dueDateTime = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                task.dueTime.getHours(),
                task.dueTime.getMinutes(),
                task.dueTime.getSeconds()
            );
        }

        // Check for overdue first - using dueDateTime instead of endDateTime
        if (dueDateTime && now > dueDateTime) return "overdue";

        // Check scheduling status
        if (startDateTime && now < startDateTime) return "todo";
        if (startDateTime && now >= startDateTime) {
            // If task has started but no due date, it's in-progress
            // If task has started and due date is in future, it's in-progress
            return "in-progress";
        }

        return task.status || "backlog";
    }, []);

    // Batch processing for overdue task checks
    const checkAndMoveOverdueTasks = useCallback((tasks: Task[]): Task[] => {
        const endTimer = performanceMonitor.current.startTimer('checkOverdueTasks');

        const batchedTasks = [];
        const batchSize = BATCH_SIZE;

        for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            const processedBatch = batch.map(task => {
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
            batchedTasks.push(...processedBatch);
        }

        endTimer();
        return batchedTasks;
    }, [determineTaskStatus]);

    // Optimized task loading with caching and error recovery
    const loadTasks = useCallback(async (force: boolean = false) => {
        if (!authState.user || !activeGroup) return;

        // Abort previous request if still running
        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();

        const cacheKey = `tasks_${activeGroup}_${authState.user.email}`;
        if (!force) {
            const cached = cache.current.get<Task[]>(cacheKey);
            if (cached && Date.now() - lastLoadTime.current < 30000) { // 30 second cache
                const updated = folders.map((f) => ({
                    ...f,
                    tasks: cached.filter((t) => t.status === f.id),
                }));
                setLists(updated);
                return;
            }
        }

        setLoading(true);
        setError(null);
        const endTimer = performanceMonitor.current.startTimer('loadTasks');

        try {
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);
            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }

            const tasks: Task[] = await fetchGoogleTasks(token, activeGroup);

            if (abortController.current?.signal.aborted) {
                return; // Request was cancelled
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

            const updated = folders.map((f) => ({
                ...f,
                tasks: tasksWithActivityLog.filter((t) => t.status === f.id),
            }));

            startTransition(() => {
                setLists(updated);
            });
        } catch (err) {
            if (abortController.current?.signal.aborted) {
                return; // Ignore aborted requests
            }
            console.error("Task load error:", err);
            setError("Failed to load tasks.");
        } finally {
            setLoading(false);
            endTimer();
        }
    }, [authState, activeGroup, getFreshToken, checkAndMoveOverdueTasks]);

    // Load tasks when active group changes
    useEffect(() => {
        if (activeGroup && authState.user?.accessToken) {
            loadTasks();
        }
    }, [activeGroup, loadTasks]);

    // Debounced save task function
    const saveTask = useAdvancedDebounce(
        useCallback(async (task: Task) => {
            if (!authState.user || !activeGroup) return;
            const endTimer = performanceMonitor.current.startTimer('saveTask');

            try {
                let token = authState.user.accessToken;
                const tokenInfo = await verifyTokenScopes(token);
                if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                    token = await getFreshToken();
                }
                await updateGoogleTask(token, task.id, task, activeGroup);

                // Update cache
                const cacheKey = `tasks_${activeGroup}_${authState.user.email}`;
                cache.current.clear(); // Clear to force refresh
            } catch (err) {
                console.error("Failed to save task:", err);
                setError("Failed to save task.");
                loadTasks(true); // Force reload on error
            } finally {
                endTimer();
            }
        }, [authState, activeGroup, getFreshToken, loadTasks]),
        500,
        { maxWait: 2000 }
    );

    // Enhanced sorting with multiple algorithms
    const sortTasks = useCallback((tasks: Task[], sortType: string, order: 'asc' | 'desc' = 'desc'): Task[] => {
        const endTimer = performanceMonitor.current.startTimer('sortTasks');

        let sortedTasks: Task[];
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

        // Use different sorting algorithms based on data size
        if (tasks.length > 100) {
            // Use quicksort for large datasets
            const compareFn = (a: Task, b: Task): number => {
                switch (sortType) {
                    case "priority-high":
                    case "priority-low":
                        const comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
                        return sortType === "priority-low" ? -comparison : comparison;
                    case "due-date-asc":
                    case "due-date-desc":
                        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : (sortType === "due-date-asc" ? Infinity : -Infinity);
                        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : (sortType === "due-date-asc" ? Infinity : -Infinity);
                        return sortType === "due-date-asc" ? dateA - dateB : dateB - dateA;
                    case "title-asc":
                    case "title-desc":
                        const titleComparison = a.title.localeCompare(b.title);
                        return sortType === "title-desc" ? -titleComparison : titleComparison;
                    case "created-asc":
                    case "created-desc":
                        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return sortType === "created-asc" ? createdA - createdB : createdB - createdA;
                    default:
                        return 0;
                }
            };

            sortedTasks = sortingAlgorithms.quickSort(tasks, compareFn);
        } else {
            // Use multi-criteria sort for smaller datasets
            const criteria: Array<{ key: keyof Task; order: 'asc' | 'desc' }> = [];

            switch (sortType) {
                case "priority-high":
                    criteria.push({ key: 'priority', order: 'desc' });
                    break;
                case "due-date-asc":
                    criteria.push({ key: 'dueDate', order: 'asc' });
                    break;
                case "title-asc":
                    criteria.push({ key: 'title', order: 'asc' });
                    break;
                default:
                    criteria.push({ key: 'createdAt', order: 'desc' });
            }

            sortedTasks = sortingAlgorithms.multiCriteriaSort([...tasks], criteria);
        }

        endTimer();
        return order === 'asc' ? sortedTasks : sortedTasks.reverse();
    }, []);

    // Optimized drag and drop with virtual scrolling support
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const endTimer = performanceMonitor.current.startTimer('dragEnd');
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
                startTransition(() => {
                    const copy = [...lists];
                    copy[fromIndex].tasks = reordered;
                    setLists(copy);
                });
            } else {
                const moved = source.tasks[itemIndex];
                const oldStatus = moved.status;
                const newStatus = dest.id as Status;

                const updatedTask = addActivityLogEntry(
                    { ...moved, status: newStatus },
                    "status_changed",
                    `Status changed from "${folders.find(f => f.id === oldStatus)?.title}" to "${folders.find(f => f.id === newStatus)?.title}"`
                );

                startTransition(() => {
                    const copy = [...lists];
                    copy[fromIndex].tasks = source.tasks.filter((t) => t.id !== active.id);
                    copy[toIndex].tasks = [...dest.tasks, updatedTask];
                    setLists(copy);
                });

                saveTask(updatedTask);
            }
        }
        endTimer();
    }, [lists, saveTask]);

    // Enhanced quick add with smart defaults and batch processing
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

            const idx = lists.findIndex((l) => l.id === smartStatus);
            if (idx !== -1) {
                startTransition(() => {
                    const copy = [...lists];
                    copy[idx].tasks = [...copy[idx].tasks, taskWithActivityLog];
                    setLists(copy);
                });
            }

            // Clear cache to ensure fresh data
            cache.current.clear();
        } catch (err) {
            console.error("Failed to create task:", err);
            setError("Failed to create task.");
        } finally {
            setQuickAddTitle("");
            setQuickAddStatus(null);
            endTimer();
        }
    }, [quickAddTitle, authState, activeGroup, determineTaskStatus, getFreshToken, lists]);

    // Optimized task click handler with preloading
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
    }, []);

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
            } catch (err) {
                console.error("Failed to delete tasks:", err);
                setError("Failed to delete tasks.");
            } finally {
                endTimer();
            }
        }, [authState, activeGroup, getFreshToken]),

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
            } catch (err) {
                console.error("Failed to update tasks:", err);
                setError("Failed to update tasks.");
            } finally {
                endTimer();
            }
        }, [authState, activeGroup, getFreshToken, lists, loadTasks])
    };

    // Enhanced handlers with optimizations
    const handleCreateGroup = useCallback(async () => {
        console.log("Create new group");
        // Implementation would go here
    }, []);

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
        } catch (err) {
            console.error("Failed to delete task:", err);
            setError("Failed to delete task.");
        } finally {
            endTimer();
        }
    }, [authState, activeGroup, getFreshToken, selectedTask]);

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
                    const copy = [...lists];
                    copy[idx].tasks = [...copy[idx].tasks, taskWithActivityLog];
                    setLists(copy);
                });
            }

            cache.current.clear();
        } catch (err) {
            console.error("Failed to duplicate task:", err);
            setError("Failed to duplicate task.");
        } finally {
            endTimer();
        }
    }, [authState, activeGroup, getFreshToken, lists]);

    const handleMove = useCallback((taskId: string, newStatus: Status) => {
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
                        ? [...l.tasks, updatedTask]
                        : l.tasks.filter(t => t.id !== taskId)
                }))
            );
        });

        saveTask(updatedTask);
        setIsDialogOpen(false);
        setSelectedTask(null);
    }, [lists, saveTask]);

    const handleSaveTaskDetail = useCallback(async (task: Task) => {
        if (!authState.user || !activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('saveTaskDetail');
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            if (task.id) {
                const smartStatus = determineTaskStatus(task);
                const finalTask = { ...task, status: smartStatus };
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

                startTransition(() => {
                    setLists(prev =>
                        prev.map(l => ({
                            ...l,
                            tasks: l.id === smartStatus
                                ? [...l.tasks.filter(t => t.id !== task.id), updatedTask]
                                : l.tasks.filter(t => t.id !== task.id)
                        }))
                    );
                });
            } else {
                const smartStatus = determineTaskStatus(task);
                const newTask = { ...task, status: smartStatus };
                const taskWithActivityLog = {
                    ...newTask,
                    activityLog: newTask.activityLog && newTask.activityLog.length > 0
                        ? newTask.activityLog
                        : createInitialActivityLog()
                };

                const created = await createGoogleTask(token, taskWithActivityLog, activeGroup);
                const idx = lists.findIndex(l => l.id === smartStatus);
                if (idx !== -1) {
                    startTransition(() => {
                        const copy = [...lists];
                        copy[idx].tasks = [...copy[idx].tasks, created];
                        setLists(copy);
                    });
                }
            }

            setIsDialogOpen(false);
            setSelectedTask(null);
            cache.current.clear();
        } catch (err) {
            console.error("Failed to save task:", err);
            setError("Failed to save task.");
        } finally {
            endTimer();
        }
    }, [authState, activeGroup, getFreshToken, determineTaskStatus, lists]);

    // Enhanced folder operations with batch processing
    const handleCopyTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder || !authState.user || !activeGroup) return;

        const endTimer = performanceMonitor.current.startTimer('copyTasks');
        try {
            const tokenInfo = await verifyTokenScopes(authState.user.accessToken);
            const token = tokenInfo?.scope?.includes("tasks")
                ? authState.user.accessToken
                : await getFreshToken();

            const batchSize = 5;
            for (let i = 0; i < folder.tasks.length; i += batchSize) {
                const batch = folder.tasks.slice(i, i + batchSize);
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
        } catch (err) {
            console.error("Failed to copy tasks:", err);
            setError("Failed to copy tasks.");
        } finally {
            endTimer();
        }
    }, [lists, authState, activeGroup, getFreshToken, loadTasks]);

    const handleMoveTasks = useCallback(async (fromFolderId: string, toFolderId: string) => {
        const fromFolder = lists.find(l => l.id === fromFolderId);
        if (!fromFolder) return;

        const updatedTasks = fromFolder.tasks.map(task =>
            addActivityLogEntry(
                { ...task, status: toFolderId as Status },
                "status_changed",
                `Moved from "${folders.find(f => f.id === fromFolderId)?.title}" to "${folders.find(f => f.id === toFolderId)?.title}"`
            )
        );

        startTransition(() => {
            setLists(prev => prev.map(l => ({
                ...l,
                tasks: l.id === toFolderId
                    ? [...l.tasks, ...updatedTasks]
                    : l.id === fromFolderId
                        ? []
                        : l.tasks
            })));
        });

        // Save all moved tasks in batches
        const batchSize = 5;
        for (let i = 0; i < updatedTasks.length; i += batchSize) {
            const batch = updatedTasks.slice(i, i + batchSize);
            await Promise.all(batch.map(task => saveTask(task)));
        }
    }, [lists, saveTask]);

    const handleArchiveTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder) return;

        const archivedTasks = folder.tasks.map(task =>
            addActivityLogEntry(
                { ...task, status: "archive" },
                "archived",
                `Task archived from "${folders.find(f => f.id === folderId)?.title}"`
            )
        );

        startTransition(() => {
            setLists(prev => prev.map(l => ({
                ...l,
                tasks: l.id === "archive"
                    ? [...l.tasks, ...archivedTasks]
                    : l.id === folderId
                        ? []
                        : l.tasks
            })));
        });

        // Save all archived tasks in batches
        const batchSize = 5;
        for (let i = 0; i < archivedTasks.length; i += batchSize) {
            const batch = archivedTasks.slice(i, i + batchSize);
            await Promise.all(batch.map(task => saveTask(task)));
        }
    }, [lists, saveTask]);

    const handleDeleteTasks = useCallback(async (folderId: string) => {
        const folder = lists.find(l => l.id === folderId);
        if (!folder || !authState.user || !activeGroup) return;

        if (!window.confirm(`Are you sure you want to delete all ${folder.tasks.length} tasks in ${folder.title}? This action cannot be undone.`)) {
            return;
        }

        const taskIds = folder.tasks.map(task => task.id);
        await handleBatchOperations.deleteMultiple(taskIds);
    }, [lists, authState, activeGroup, handleBatchOperations.deleteMultiple]);

    const handleSortTasks = useCallback((folderId: string, sortType: string) => {
        startTransition(() => {
            setLists(prev => prev.map(l => ({
                ...l,
                tasks: l.id === folderId ? sortTasks(l.tasks, sortType, sortOrder) : l.tasks
            })));
        });
    }, [sortTasks, sortOrder]);

    // Enhanced handlers for individual tasks
    const handleEditTask = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    }, []);

    const handleMoveTask = useCallback((taskId: string, targetStatus: string) => {
        handleMove(taskId, targetStatus as Status);
    }, [handleMove]);

    const handleCopyTask = useCallback(async (task: Task) => {
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

            const idx = lists.findIndex(l => l.id === task.status);
            if (idx !== -1) {
                startTransition(() => {
                    const copy = [...lists];
                    copy[idx].tasks = [...copy[idx].tasks, created];
                    setLists(copy);
                });
            }
        } catch (err) {
            console.error("Failed to copy task:", err);
            setError("Failed to copy task.");
        }
    }, [authState, activeGroup, getFreshToken, lists]);

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
    }, [lists, saveTask]);

    // Clear all filters function
    const handleClearFilters = useCallback(() => {
        startTransition(() => {
            setSearchTerm("");
            setFilterPriority("all");
            setFilterStatus("all");
            setFilterTags("");
            setSortBy("created-desc");
            setSortOrder("desc");
            setDateRange({});
        });
    }, []);

    // Enhanced filtering and sorting with memoization and virtual scrolling
    const filteredLists = useMemo(() => {
        const endTimer = performanceMonitor.current.startTimer('filterAndSort');

        const result = lists.map(l => ({
            ...l,
            tasks: advancedFilters.smartFilter(l.tasks, {
                searchTerm,
                priority: filterPriority,
                status: filterStatus,
                tags: filterTags,
                dateRange,
                fuzzyThreshold: 0.6
            }).sort((a, b) => {
                return sortTasks([a, b], sortBy, sortOrder)[0] === a ? -1 : 1;
            })
        }));

        endTimer();
        return result;
    }, [lists, searchTerm, filterPriority, filterStatus, filterTags, dateRange, sortBy, sortOrder, sortTasks]);

    // Virtual scrolling helpers
    const getVirtualItems = useCallback((tasks: Task[], startIndex: number, endIndex: number) => {
        return tasks.slice(startIndex, endIndex);
    }, []);

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
            visibleTasks: getVirtualItems(tasks, startIndex, endIndex)
        };
    }, [containerHeight, virtualScrollOffset, getVirtualItems]);

    // Performance statistics
    const performanceStats = useMemo(() => {
        return performanceMonitor.current.getStats();
    }, [lists.length, filteredLists.length]);

    // Computed statistics with memoization
    const statistics = useMemo(() => {
        const endTimer = performanceMonitor.current.startTimer('calculateStatistics');

        const totalTasks = lists.filter(l => l.id !== 'archive').reduce((sum, l) => sum + l.tasks.length, 0);
        const completedTasks = lists.find(l => l.id === "done")?.tasks.length ?? 0;
        const overdueTasks = lists.find(l => l.id === "overdue")?.tasks.length ?? 0;
        const urgentTasks = lists.filter(l => l.id !== 'archive').reduce(
            (sum, l) => sum + l.tasks.filter(t => t.priority === "urgent").length,
            0
        );
        const archivedTasks = lists.find(l => l.id === "archive")?.tasks ?? [];

        endTimer();

        return {
            totalTasks,
            completedTasks,
            urgentTasks,
            overdueTasks,
            archivedTasks,
            performanceStats
        };
    }, [lists]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, []);

    return {
        // Core state
        authState,
        groups,
        activeGroup,
        setActiveGroup,
        lists,
        filteredLists,
        loading: loading || isPending,
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
        performanceStats
    };
}

// Helper function to add activity log entry (optimized)
const addActivityLogEntry = (task: Task, action: string, details: string, userId: string = "user"): Task => {
    const now = new Date();
    const activityEntry = {
        id: `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`,
        details,
        action,
        userId,
        timestamp: now
    };

    // Limit activity log to prevent memory bloat
    const activityLog = [...(task.activityLog || []), activityEntry];
    if (activityLog.length > 50) {
        activityLog.splice(0, activityLog.length - 50);
    }

    return {
        ...task,
        activityLog
    };
};

// Helper function to create initial activity log for new tasks (optimized)
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