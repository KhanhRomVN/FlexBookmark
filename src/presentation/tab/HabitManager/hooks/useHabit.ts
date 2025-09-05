import { useState, useEffect, useCallback, useMemo } from 'react';
import { HabitServer } from '../services/habitService';
import { Habit, HabitFormData } from '../types/types';
import { createHabit, calculateStreak } from '../utils/habitUtils';
import ChromeAuthManager from '../../../../utils/chromeAuth';

export const useHabit = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [sheetId, setSheetId] = useState<string>('');
    const [authToken, setAuthToken] = useState<string>('');
    const [hasDriveAccess, setHasDriveAccess] = useState(false);

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

    const loadHabits = useCallback(async () => {
        if (!authToken || !hasDriveAccess) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let currentSheetId = sheetId;

            if (!currentSheetId) {
                const id = await habitService.setupDrive();
                setSheetId(id);
                currentSheetId = id;
            }

            const habitsData = await habitService.fetchHabitsFromServer();
            setHabits(habitsData);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [sheetId, habitService, authToken, hasDriveAccess]);

    const addHabit = useCallback(async (formData: HabitFormData) => {
        if (!authToken || !hasDriveAccess) throw new Error('Not authenticated or missing Drive access');

        try {
            const newHabit = createHabit(formData);
            await habitService.createHabitOnServer(newHabit);
            setHabits(prev => [...prev, newHabit]);
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [habitService, authToken, hasDriveAccess]);

    const updateHabit = useCallback(async (habit: Habit) => {
        if (!authToken || !hasDriveAccess) throw new Error('Not authenticated or missing Drive access');

        try {
            await habitService.updateHabitOnServer(habit);
            setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [habitService, authToken, hasDriveAccess]);

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
            setHabits(prev => prev.filter(h => h.id !== habitId));
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authToken, habitService, hasDriveAccess]);

    useEffect(() => {
        if (authToken && hasDriveAccess) {
            loadHabits();
        }
    }, [authToken, hasDriveAccess, loadHabits]);

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
        hasDriveAccess
    };
};