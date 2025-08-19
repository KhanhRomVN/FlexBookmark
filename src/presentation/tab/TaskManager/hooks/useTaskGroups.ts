import { useState, useEffect, useCallback } from "react";
import { fetchGoogleTaskGroups, verifyTokenScopes } from "../../../../utils/GGTask";
import { useAuth } from "./useAuth";
import { AdvancedCache } from "./useCache";

interface TaskGroup {
    id: string;
    title: string;
}

const cache = new AdvancedCache<TaskGroup[]>();

export function useTaskGroups() {
    const [groups, setGroups] = useState<TaskGroup[]>([]);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const { authState, getFreshToken } = useAuth();

    const loadTaskGroups = useCallback(async () => {
        if (!authState.user?.email) return;

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
            let token = authState.user.accessToken;
            const tokenInfo = await verifyTokenScopes(token);

            if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
                token = await getFreshToken();
            }

            const fetchedGroups = await fetchGoogleTaskGroups(token);
            cache.set(cacheKey, fetchedGroups, 10 * 60 * 1000);
            setGroups(fetchedGroups);
            if (fetchedGroups.length && !activeGroup) {
                setActiveGroup(fetchedGroups[0].id);
            }
        } catch (err) {
            console.error("Failed to load task groups:", err);
        }
    }, [authState.user, activeGroup, getFreshToken]);

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