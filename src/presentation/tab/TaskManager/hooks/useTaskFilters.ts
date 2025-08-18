// src/presentation/tab/TaskManager/hooks/useTaskFilters.ts
import { useState } from "react";

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
    };
}