import { useState } from "react";
import type { Task } from "../types/task";
import { advancedFilters, sortingAlgorithms } from "./useAdvancedAlgorithms";

interface TaskList {
    id: string;
    title: string;
    emoji: string;
    priority: number;
    tasks: Task[];
}

export function useTaskFilters() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterTags, setFilterTags] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("created-desc");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

    const handleClearFilters = () => {
        setSearchTerm("");
        setFilterPriority("all");
        setFilterStatus("all");
        setFilterTags("");
        setSortBy("created-desc");
        setSortOrder("desc");
        setDateRange({});
    };

    // Enhanced sorting with multiple algorithms
    const sortTasks = (tasks: Task[], sortType: string, _order: 'asc' | 'desc' = 'desc'): Task[] => {
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

            return sortingAlgorithms.quickSort(tasks, compareFn);
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

            return sortingAlgorithms.multiCriteriaSort([...tasks], criteria);
        }
    };

    // Enhanced filtering with performance optimization
    const getFilteredLists = (lists: TaskList[]) => {
        return lists.map(l => ({
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
    };

    return {
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
    };
}