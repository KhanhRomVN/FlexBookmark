import { useCallback } from 'react';
import { DriveFileManager } from '../../utils/drive/DriveFileManager';
import type { Habit, HabitFormData } from '../../types/habit';
import { PerformanceMonitor } from '../../utils/performance/PerformanceMonitor';

const generateHabitId = (): string => {
    return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

interface UseHabitCRUDParams {
    driveManager: DriveFileManager | null;
    currentSheetId: string | null;
    habits: Habit[];
    updateHabitsCache: (habits: Habit[]) => Promise<void>;
    optimisticUpdate: (habitId: string, updater: (habit: Habit) => Habit) => void;
    revertOptimisticUpdate: (habitId: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useHabitCRUD = ({
    driveManager,
    currentSheetId,
    habits,
    updateHabitsCache,
    optimisticUpdate,
    revertOptimisticUpdate,
    setLoading,
    setError
}: UseHabitCRUDParams) => {
    const performanceMonitor = PerformanceMonitor.getInstance();

    // Helper to validate CRUD prerequisites
    const validatePrerequisites = (): boolean => {
        if (!driveManager || !currentSheetId) {
            setError('System not initialized. Please refresh and try again.');
            return false;
        }
        return true;
    };

    // Create new habit
    const createHabit = useCallback(async (formData: HabitFormData): Promise<string | null> => {
        if (!validatePrerequisites()) return null;

        const operationId = `create-habit-${Date.now()}`;
        performanceMonitor.startTiming(operationId);

        try {
            setLoading(true);
            setError(null);

            // Generate new habit with unique ID
            const newHabit: Habit = {
                id: generateHabitId(),
                name: formData.name,
                description: formData.description || '',
                habitType: formData.habitType,
                difficultyLevel: formData.difficultyLevel,
                goal: formData.habitType === 'good' ? formData.goal : undefined,
                limit: formData.habitType === 'bad' ? formData.limit : undefined,
                currentStreak: 0,
                longestStreak: 0,
                dailyTracking: Array(31).fill(null), // 31 days for the month
                createdDate: new Date(),
                colorCode: formData.colorCode || '#3b82f6',
                category: formData.category,
                tags: formData.tags || [],
                isArchived: false,
                isQuantifiable: formData.isQuantifiable || false,
                unit: formData.unit || '',
                startTime: formData.startTime || '',
                subtasks: formData.subtasks || []
            };


            // Optimistic update - add to local state immediately
            const updatedHabits = [...habits, newHabit];
            await updateHabitsCache(updatedHabits);

            // Persist to Google Sheets
            await driveManager!.createHabit(currentSheetId!, newHabit);

            performanceMonitor.endTiming(operationId);

            return newHabit.id;

        } catch (error) {
            console.error('❌ Failed to create habit:', error);

            // Revert optimistic update on error
            const revertedHabits = habits; // Original habits without the new one
            await updateHabitsCache(revertedHabits);

            const errorMessage = error instanceof Error ? error.message : 'Failed to create habit';
            setError(`Create failed: ${errorMessage}`);

            return null;
        } finally {
            setLoading(false);
            performanceMonitor.endTiming(operationId);
        }
    }, [driveManager, currentSheetId, habits, updateHabitsCache, setLoading, setError, performanceMonitor]);

    // Update existing habit
    const updateHabit = useCallback(async (updatedHabit: Habit): Promise<boolean> => {
        if (!validatePrerequisites()) return false;

        const operationId = `update-habit-${updatedHabit.id}`;
        performanceMonitor.startTiming(operationId);

        const originalHabit = habits.find(h => h.id === updatedHabit.id);
        if (!originalHabit) {
            setError('Habit not found');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('Updating habit:', updatedHabit.name);

            // Optimistic update
            optimisticUpdate(updatedHabit.id, () => updatedHabit);

            // Persist to Google Sheets
            await driveManager!.updateHabit(currentSheetId!, updatedHabit);

            // Update cache with the new data
            const updatedHabits = habits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
            await updateHabitsCache(updatedHabits);

            console.log('✅ Habit updated successfully:', updatedHabit.id);
            return true;

        } catch (error) {
            console.error('❌ Failed to update habit:', error);

            // Revert optimistic update on error
            revertOptimisticUpdate(updatedHabit.id);

            const errorMessage = error instanceof Error ? error.message : 'Failed to update habit';
            setError(`Update failed: ${errorMessage}`);

            return false;
        } finally {
            setLoading(false);
            performanceMonitor.endTiming(operationId);
        }
    }, [
        driveManager, currentSheetId, habits, optimisticUpdate,
        revertOptimisticUpdate, updateHabitsCache, setLoading, setError, performanceMonitor
    ]);

    // Delete habit
    const deleteHabit = useCallback(async (habitId: string): Promise<boolean> => {
        if (!validatePrerequisites()) return false;

        const operationId = `delete-habit-${habitId}`;
        performanceMonitor.startTiming(operationId);

        const habitToDelete = habits.find(h => h.id === habitId);
        if (!habitToDelete) {
            setError('Habit not found');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('Deleting habit:', habitToDelete.name);

            // Optimistic update - remove from local state
            const updatedHabits = habits.filter(h => h.id !== habitId);
            await updateHabitsCache(updatedHabits);

            // Delete from Google Sheets
            await driveManager!.deleteHabit(currentSheetId!, habitId);

            console.log('✅ Habit deleted successfully:', habitId);
            return true;

        } catch (error) {
            console.error('❌ Failed to delete habit:', error);

            // Revert optimistic update on error - restore the habit
            await updateHabitsCache(habits);

            const errorMessage = error instanceof Error ? error.message : 'Failed to delete habit';
            setError(`Delete failed: ${errorMessage}`);

            return false;
        } finally {
            setLoading(false);
            performanceMonitor.endTiming(operationId);
        }
    }, [driveManager, currentSheetId, habits, updateHabitsCache, setLoading, setError, performanceMonitor]);

    // Archive/Unarchive habit
    const archiveHabit = useCallback(async (habitId: string, archive: boolean): Promise<boolean> => {
        if (!validatePrerequisites()) return false;

        const operationId = `archive-habit-${habitId}`;
        performanceMonitor.startTiming(operationId);

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            setError('Habit not found');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            const action = archive ? 'Archiving' : 'Unarchiving';
            console.log(`${action} habit:`, originalHabit.name);

            // Optimistic update
            const updatedHabit = { ...originalHabit, isArchived: archive };
            optimisticUpdate(habitId, () => updatedHabit);

            // Persist to Google Sheets
            await driveManager!.archiveHabit(currentSheetId!, habitId, archive);

            // Update cache
            const updatedHabits = habits.map(h => h.id === habitId ? updatedHabit : h);
            await updateHabitsCache(updatedHabits);

            console.log(`✅ Habit ${archive ? 'archived' : 'unarchived'} successfully:`, habitId);
            return true;

        } catch (error) {
            console.error(`❌ Failed to ${archive ? 'archive' : 'unarchive'} habit:`, error);

            // Revert optimistic update on error
            revertOptimisticUpdate(habitId);

            const action = archive ? 'archive' : 'unarchive';
            const errorMessage = error instanceof Error ? error.message : `Failed to ${action} habit`;
            setError(`${action.charAt(0).toUpperCase() + action.slice(1)} failed: ${errorMessage}`);

            return false;
        } finally {
            setLoading(false);
            performanceMonitor.endTiming(operationId);
        }
    }, [
        driveManager, currentSheetId, habits, optimisticUpdate,
        revertOptimisticUpdate, updateHabitsCache, setLoading, setError, performanceMonitor
    ]);

    // Update daily habit tracking
    const updateDailyHabit = useCallback(async (
        habitId: string,
        day: number,
        value: number
    ): Promise<boolean> => {
        if (!validatePrerequisites()) return false;

        if (day < 1 || day > 31) {
            setError('Day must be between 1 and 31');
            return false;
        }

        const operationId = `update-daily-${habitId}-${day}`;
        performanceMonitor.startTiming(operationId);

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            setError('Habit not found');
            return false;
        }

        try {
            setError(null);

            console.log(`Updating daily tracking for habit ${originalHabit.name}, day ${day}, value: ${value}`);

            // Optimistic update - update local dailyTracking array
            const updatedDailyTracking = [...originalHabit.dailyTracking];
            updatedDailyTracking[day - 1] = value;

            const updatedHabit = {
                ...originalHabit,
                dailyTracking: updatedDailyTracking
            };

            optimisticUpdate(habitId, () => updatedHabit);

            // Persist to Google Sheets (this will also recalculate streaks)
            await driveManager!.updateDailyHabit(currentSheetId!, habitId, day, value);

            // Refresh the habit data to get updated streaks from the sheet
            const refreshedHabit = await driveManager!.getHabitWithTracking(currentSheetId!, habitId);

            if (refreshedHabit) {
                // Update cache with the refreshed data that includes recalculated streaks
                const updatedHabits = habits.map(h => h.id === habitId ? refreshedHabit : h);
                await updateHabitsCache(updatedHabits);
            }

            console.log('✅ Daily habit tracking updated successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to update daily habit tracking:', error);

            // Revert optimistic update on error
            revertOptimisticUpdate(habitId);

            const errorMessage = error instanceof Error ? error.message : 'Failed to update daily tracking';
            setError(`Update failed: ${errorMessage}`);

            return false;
        } finally {
            performanceMonitor.endTiming(operationId);
        }
    }, [
        driveManager, currentSheetId, habits, optimisticUpdate,
        revertOptimisticUpdate, updateHabitsCache, setError, performanceMonitor
    ]);

    // Bulk operations
    const bulkArchiveHabits = useCallback(async (habitIds: string[], archive: boolean): Promise<boolean> => {
        if (!validatePrerequisites() || habitIds.length === 0) return false;

        const operationId = `bulk-archive-${habitIds.length}`;
        performanceMonitor.startTiming(operationId);

        try {
            setLoading(true);
            setError(null);

            const action = archive ? 'Archiving' : 'Unarchiving';
            console.log(`${action} ${habitIds.length} habits`);

            // Process each habit
            const results = await Promise.allSettled(
                habitIds.map(habitId => archiveHabit(habitId, archive))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
            const failed = results.length - successful;

            if (failed > 0) {
                console.warn(`${failed} out of ${results.length} operations failed`);
                setError(`${failed} operations failed out of ${results.length}`);
                return false;
            }

            console.log(`✅ Bulk ${archive ? 'archive' : 'unarchive'} completed successfully`);
            return true;

        } catch (error) {
            console.error(`❌ Bulk ${archive ? 'archive' : 'unarchive'} failed:`, error);

            const action = archive ? 'archive' : 'unarchive';
            const errorMessage = error instanceof Error ? error.message : `Bulk ${action} failed`;
            setError(errorMessage);

            return false;
        } finally {
            setLoading(false);
            performanceMonitor.endTiming(operationId);
        }
    }, [archiveHabit, setLoading, setError, performanceMonitor]);

    const bulkDeleteHabits = useCallback(async (habitIds: string[]): Promise<boolean> => {
        if (!validatePrerequisites() || habitIds.length === 0) return false;

        const operationId = `bulk-delete-${habitIds.length}`;
        performanceMonitor.startTiming(operationId);

        try {
            setLoading(true);
            setError(null);

            console.log(`Deleting ${habitIds.length} habits`);

            const results = await Promise.allSettled(
                habitIds.map(habitId => deleteHabit(habitId))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
            const failed = results.length - successful;

            if (failed > 0) {
                console.warn(`${failed} out of ${results.length} delete operations failed`);
                setError(`${failed} delete operations failed out of ${results.length}`);
                return false;
            }

            console.log('✅ Bulk delete completed successfully');
            return true;

        } catch (error) {
            console.error('❌ Bulk delete failed:', error);

            const errorMessage = error instanceof Error ? error.message : 'Bulk delete failed';
            setError(errorMessage);

            return false;
        } finally {
            setLoading(false);
            performanceMonitor.endTiming(operationId);
        }
    }, [deleteHabit, setLoading, setError, performanceMonitor]);

    return {
        // Single operations
        createHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        updateDailyHabit,

        // Bulk operations
        bulkArchiveHabits,
        bulkDeleteHabits
    };
};