import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HabitServer } from '../services/habitService';
import { Habit, HabitFormData } from '../types/types';
import { createHabit, calculateStreak } from '../utils/habitUtils';
import ChromeAuthManager from '../../../../utils/chromeAuth';
import { cacheHabits, getCachedHabits } from '../utils/cacheUtils';

export const useHabit = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [cachedHabits, setCachedHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [sheetId, setSheetId] = useState<string>('');
    const [authToken, setAuthToken] = useState<string>('');
    const [hasDriveAccess, setHasDriveAccess] = useState(false);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const lastSyncRef = useRef<number>(0);
    const SYNC_COOLDOWN = 30000; // 30 seconds cooldown

    const habitService = useMemo(() => new HabitServer(authToken), [authToken]);

    // Lắng nghe auth từ ChromeAuthManager
    useEffect(() => {
        const authManager = ChromeAuthManager.getInstance();
        const unsubscribe = authManager.subscribe(async (state) => {
            if (state.isAuthenticated && state.user) {
                setAuthToken(state.user.accessToken);

                // Check if we have required scopes
                const hasAccess = await authManager.hasRequiredScopes([
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/spreadsheets'
                ]);
                setHasDriveAccess(hasAccess);
            } else {
                setAuthToken('');
                setHasDriveAccess(false);
            }
        });

        authManager.initialize();

        return unsubscribe;
    }, []);

    // Load habits from cache first
    useEffect(() => {
        const loadFromCache = async () => {
            try {
                const cached = await getCachedHabits();
                if (cached && cached.length > 0) {
                    console.log('Loading habits from cache:', cached.length);
                    setCachedHabits(cached);
                    setHabits(cached); // Show cached habits immediately
                    setLoading(false);
                } else {
                    console.log('No cached habits found');
                }
            } catch (cacheError) {
                console.error('Error loading from cache:', cacheError);
            }
        };
        loadFromCache();
    }, []);

    const loadHabits = useCallback(async (isBackground: boolean = false) => {
        if (isBackground) {
            const now = Date.now();
            if (now - lastSyncRef.current < SYNC_COOLDOWN) {
                console.log('Sync skipped - in cooldown period');
                return;
            }
        }

        if (!authToken || !hasDriveAccess) {
            console.log('No auth token or drive access');
            setLoading(false);
            return;
        }

        try {
            if (!isBackground) {
                setLoading(true);
            } else {
                setIsBackgroundLoading(true);
            }

            let currentSheetId = sheetId;

            if (!currentSheetId) {
                console.log('Setting up Drive...');
                const id = await habitService.setupDrive();
                setSheetId(id);
                currentSheetId = id;
                console.log('Drive setup complete, sheet ID:', id);
            }

            console.log('Fetching habits from server...');
            const habitsData = await habitService.fetchHabitsFromServer();
            console.log('Habits data received:', habitsData);

            // Đảm bảo habitsData là mảng hợp lệ
            const validHabits = Array.isArray(habitsData) ? habitsData : [];
            console.log('Valid habits count:', validHabits.length);

            setHabits(validHabits);
            // Cache the new habits
            await cacheHabits(validHabits);
            lastSyncRef.current = Date.now(); // Update last sync time

            if (isBackground) {
                console.log('Background sync completed');
            }
        } catch (err) {
            console.error('Error loading habits:', err);
            setError((err as Error).message);
            // Keep showing cached habits even if there's an error
            if (cachedHabits.length === 0 && habits.length === 0) {
                setHabits([]);
            }
        } finally {
            setLoading(false);
            setIsBackgroundLoading(false);
        }
    }, [sheetId, habitService, authToken, hasDriveAccess, cachedHabits, habits]);

    const addHabit = useCallback(async (formData: HabitFormData) => {
        if (!authToken || !hasDriveAccess) throw new Error('Not authenticated or missing Drive access');

        try {
            const newHabit = createHabit(formData);
            await habitService.createHabitOnServer(newHabit);
            const updatedHabits = [...habits, newHabit];
            setHabits(updatedHabits);
            await cacheHabits(updatedHabits); // Update cache
            lastSyncRef.current = Date.now(); // Reset sync cooldown
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [habitService, authToken, hasDriveAccess, habits]);

    const updateHabit = useCallback(async (habit: Habit) => {
        if (!authToken || !hasDriveAccess) throw new Error('Not authenticated or missing Drive access');

        try {
            console.log('Updating habit:', {
                ...habit,
                createdAt: habit.createdAt?.toString(),
                updatedAt: habit.updatedAt?.toString()
            });

            await habitService.updateHabitOnServer(habit);
            const updatedHabits = habits.map(h => h.id === habit.id ? habit : h);
            setHabits(updatedHabits);
            await cacheHabits(updatedHabits);
            lastSyncRef.current = Date.now();
        } catch (err) {
            console.error('Error updating habit:', err);
            setError((err as Error).message);
            throw err;
        }
    }, [habitService, authToken, hasDriveAccess, habits]);

    const toggleHabit = useCallback(async (habitId: string, completed: boolean) => {
        if (!authToken || !hasDriveAccess) throw new Error('Not authenticated or missing Drive access');

        try {
            const habit = habits.find(h => h.id === habitId);
            if (!habit) return;

            const updated = calculateStreak(habit, completed);
            await updateHabit(updated);
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [habits, updateHabit, authToken, hasDriveAccess]);

    const archiveHabit = useCallback(async (habitId: string, archive: boolean) => {
        if (!authToken || !hasDriveAccess) throw new Error('Not authenticated or missing Drive access');

        try {
            const habit = habits.find(h => h.id === habitId);
            if (!habit) return;

            const updated = { ...habit, isArchived: archive, updatedAt: new Date() };
            await updateHabit(updated);
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [habits, updateHabit, authToken, hasDriveAccess]);

    const deleteHabit = useCallback(async (habitId: string) => {
        if (!authToken || !hasDriveAccess) throw new Error('Not authenticated or missing Drive access');

        try {
            await habitService.deleteHabitOnServer(habitId);
            const updatedHabits = habits.filter(h => h.id !== habitId);
            setHabits(updatedHabits);
            await cacheHabits(updatedHabits); // Update cache
            lastSyncRef.current = Date.now(); // Reset sync cooldown
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authToken, habitService, hasDriveAccess, habits]);

    useEffect(() => {
        if (authToken && hasDriveAccess) {
            if (isInitialLoad) {
                loadHabits(false);
                setIsInitialLoad(false);
            } else if (cachedHabits.length > 0) {
                // Only sync in background if we have cached data and not in cooldown
                const now = Date.now();
                if (now - lastSyncRef.current >= SYNC_COOLDOWN) {
                    console.log('Starting background sync...');
                    loadHabits(true); // Load in background
                }
            }
        }
    }, [authToken, hasDriveAccess, loadHabits, cachedHabits, isInitialLoad]);

    return {
        habits,
        loading,
        error,
        addHabit,
        updateHabit,
        toggleHabit,
        archiveHabit,
        deleteHabit,
        reloadHabits: loadHabits,
        isAuthenticated: !!authToken,
        hasDriveAccess,
        isBackgroundLoading
    };
};