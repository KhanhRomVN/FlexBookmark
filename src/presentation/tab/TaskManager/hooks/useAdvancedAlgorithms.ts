
import type { Task } from "../types/task";

// Advanced sorting algorithms with multiple criteria
export const sortingAlgorithms = {
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
export const advancedFilters = {
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

export function useAdvancedAlgorithms() {
    return {
        sortingAlgorithms,
        advancedFilters
    };
}