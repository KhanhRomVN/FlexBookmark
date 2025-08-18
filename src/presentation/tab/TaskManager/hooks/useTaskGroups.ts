// src/presentation/tab/TaskManager/hooks/useTaskGroups.ts
import { useState, useEffect, useCallback } from "react";
import { fetchGoogleTaskGroups, verifyTokenScopes } from "../../../../utils/GGTask";
import { useAuth } from "./useAuth";
import { AdvancedCache } from "./useCache";

const cache = new AdvancedCache<any[]>();

export function useTaskGroups() {
    const [groups, setGroups] = useState<any[]>([]);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const { authState, getFreshToken } = useAuth();

    const loadTaskGroups = useCallback(async () => {
        if (!authState.user) return;

        const cacheKey = `groups_${authState.user.email}`;
        const cached = cache.get(cacheKey);
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
            cache.set(cacheKey, groups, 10 * 60 * 1000);
            setGroups(groups);
            if (groups.length && !activeGroup) setActiveGroup(groups[0].id);
        } catch (err) {
            console.error("Failed to load task groups:", err);
        }
    }, [authState, activeGroup, getFreshToken]);

    useEffect(() => {
        if (authState.isAuthenticated && authState.user?.accessToken) {
            loadTaskGroups();
        }
    }, [authState, loadTaskGroups]);

    return {
        groups,
        activeGroup,
        setActiveGroup,
    };
}
