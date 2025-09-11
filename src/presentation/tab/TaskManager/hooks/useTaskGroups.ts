import { useState, useEffect, useCallback } from "react";
import { fetchGoogleTaskGroups } from "../services/GoogleTaskService";
import { useAuth } from "@/contexts/AuthContext";

// Cache implementation
class AdvancedCache<T> {
    private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
    private maxSize = 100;

    set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
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

const cache = new AdvancedCache<any>();

export interface TaskGroup {
    id: string;
    title: string;
    kind?: string;
    etag?: string;
    selfLink?: string;
    updated?: string;
}

export function useTaskGroups() {
    const [groups, setGroups] = useState<TaskGroup[]>([]);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const { authState } = useAuth();

    const loadTaskGroups = useCallback(async () => {
        if (!authState.user?.email || !authState.user?.accessToken) return;

        const cacheKey = `groups_${authState.user.email}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            setGroups(cached);
            if (cached.length && !activeGroup) {
                setActiveGroup(cached[0].id);
            }
            return;
        }

        try {
            const token = authState.user.accessToken;
            const fetchedGroups = await fetchGoogleTaskGroups(token);
            cache.set(cacheKey, fetchedGroups, 10 * 60 * 1000);
            setGroups(fetchedGroups);
            if (fetchedGroups.length && !activeGroup) {
                setActiveGroup(fetchedGroups[0].id);
            }
        } catch (err) {
            console.error("Failed to load task groups:", err);
        }
    }, [authState.user, activeGroup]);

    useEffect(() => {
        if (authState.isAuthenticated && authState.user?.accessToken) {
            loadTaskGroups();
        }
    }, [authState.isAuthenticated, authState.user?.accessToken, loadTaskGroups]);

    return {
        groups,
        activeGroup,
        setActiveGroup,
        reloadGroups: loadTaskGroups,
    };
}