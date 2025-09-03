import type {
    Habit,
    HabitFormData,
    CommonOperationResult
} from '../../types';
import { HabitUtils } from '../../utils/habit/HabitUtils';

// Define local result types since they don't exist in the imported types
interface HabitOperationResult extends CommonOperationResult<Habit> {
    needsAuth?: boolean;
}

interface BatchOperationResult {
    successful: number;
    failed: number;
    errors: string[];
    needsAuth?: boolean;
}

interface HabitOperationsParams {
    habitUtils: HabitUtils | null;
    currentSheetId: string | null;
    habits: Habit[];
    setHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    isAuthReady: () => boolean;
    getAuthStatus: () => any;
    diagnoseAuthError: (error: any) => Promise<any>;
    attemptAutoRecovery: (diagnostic: any) => Promise<boolean>;
}

export const HabitOperations = (params: HabitOperationsParams) => {
    const {
        habitUtils,
        currentSheetId,
        habits,
        setHabits,
        setLoading,
        setError,
        diagnoseAuthError,
        attemptAutoRecovery
    } = params;

    const generateHabitId = (): string => {
        return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const handleError = async (error: any, operation: string): Promise<boolean> => {
        console.error(`❌ Error in ${operation}:`, error);

        const isAuthError = error?.message?.includes('401') ||
            error?.message?.includes('403') ||
            error?.message?.includes('invalid_grant') ||
            error?.status === 401 ||
            error?.status === 403;

        if (isAuthError) {
            const diagnostic = await diagnoseAuthError(error);

            if (!diagnostic.isHealthy) {
                const criticalIssues = diagnostic.issues.filter((i: { severity: string; }) => i.severity === 'critical');

                if (criticalIssues.length > 0) {
                    const autoRecovered = await attemptAutoRecovery(diagnostic);

                    if (!autoRecovered) {
                        const errorMsg = `${operation} failed: ${diagnostic.recommendations.join(', ')}`;
                        setError(errorMsg);
                        return false;
                    }

                    return true;
                }
            }
        }

        const errorMessage = error instanceof Error ? error.message : `${operation} failed`;
        setError(errorMessage);
        return false;
    };

    const createHabit = async (formData: HabitFormData): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now()
            };
        }

        // Provide default values for goal/limit based on habit type
        // FIX 1: Provide default values when undefined
        const goal = formData.habitType === 'good' ? (formData.goal || 1) : undefined;
        const limit = formData.habitType === 'bad' ? (formData.limit || 1) : undefined;

        const newHabit: Habit = {
            id: generateHabitId(),
            name: formData.name,
            description: formData.description || '',
            habitType: formData.habitType,
            difficultyLevel: formData.difficultyLevel,
            // FIX 1: Cast to number to ensure type safety
            goal: goal as number | undefined,
            limit: limit as number | undefined,
            currentStreak: 0,
            longestStreak: 0,
            dailyTracking: Array(31).fill(null),
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

        try {
            setLoading(true);
            setError(null);

            setHabits(prev => [...prev, newHabit]);
            await habitUtils.writeHabit(currentSheetId, newHabit);

            console.log('✅ Habit created successfully:', newHabit.id);

            return {
                success: true,
                data: newHabit,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Create habit failed:', error);
            setHabits(prev => prev.filter(h => h.id !== newHabit.id));

            const shouldRetry = await handleError(error, 'Create Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Create habit failed',
                needsAuth: shouldRetry,
                timestamp: Date.now()
            };
        } finally {
            setLoading(false);
        }
    };

    const updateHabit = async (updatedHabit: Habit): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now()
            };
        }

        const originalHabit = habits.find(h => h.id === updatedHabit.id);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found',
                timestamp: Date.now()
            };
        }

        try {
            setLoading(true);
            setError(null);

            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
            const habitIndex = habits.findIndex(h => h.id === updatedHabit.id);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log('✅ Habit updated successfully:', updatedHabit.id);

            return {
                success: true,
                data: updatedHabit,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Update habit failed:', error);
            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? originalHabit : h));

            const shouldRetry = await handleError(error, 'Update Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update habit failed',
                needsAuth: shouldRetry,
                timestamp: Date.now()
            };
        } finally {
            setLoading(false);
        }
    };

    const deleteHabit = async (habitId: string): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now()
            };
        }

        const habitToDelete = habits.find(h => h.id === habitId);
        if (!habitToDelete) {
            return {
                success: false,
                error: 'Habit not found',
                timestamp: Date.now()
            };
        }

        try {
            setLoading(true);
            setError(null);

            setHabits(prev => prev.filter(h => h.id !== habitId));
            await habitUtils.deleteHabit(currentSheetId, habitId);

            console.log('✅ Habit deleted successfully:', habitId);

            return {
                success: true,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Delete habit failed:', error);
            setHabits(prev => [...prev, habitToDelete]);

            const shouldRetry = await handleError(error, 'Delete Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Delete habit failed',
                needsAuth: shouldRetry,
                timestamp: Date.now()
            };
        } finally {
            setLoading(false);
        }
    };

    const updateDailyHabit = async (
        habitId: string,
        day: number,
        value: number
    ): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now()
            };
        }

        if (day < 1 || day > 31) {
            return {
                success: false,
                error: 'Day must be between 1 and 31',
                timestamp: Date.now()
            };
        }

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found',
                timestamp: Date.now()
            };
        }

        try {
            setError(null);
            const updatedHabit = await habitUtils.updateDailyHabit(currentSheetId, habitId, day, value);

            if (updatedHabit) {
                setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
            }

            console.log('✅ Daily habit tracking updated successfully');

            // FIX 2: Handle case where updatedHabit might be null
            return {
                success: true,
                data: updatedHabit || undefined, // Convert null to undefined
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Update daily habit failed:', error);

            const shouldRetry = await handleError(error, 'Update Daily Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update daily tracking failed',
                needsAuth: shouldRetry,
                timestamp: Date.now()
            };
        }
    };

    const archiveHabit = async (habitId: string, archive: boolean): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true,
                timestamp: Date.now()
            };
        }

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found',
                timestamp: Date.now()
            };
        }

        try {
            setLoading(true);
            setError(null);

            const updatedHabit = { ...originalHabit, isArchived: archive };
            setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
            const habitIndex = habits.findIndex(h => h.id === habitId);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log(`✅ Habit ${archive ? 'archived' : 'unarchived'} successfully:`, habitId);

            return {
                success: true,
                data: updatedHabit,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error(`❌ ${archive ? 'Archive' : 'Unarchive'} habit failed:`, error);
            setHabits(prev => prev.map(h => h.id === habitId ? originalHabit : h));

            const shouldRetry = await handleError(error, `${archive ? 'Archive' : 'Unarchive'} Habit`);
            return {
                success: false,
                error: error instanceof Error ? error.message : `${archive ? 'Archive' : 'Unarchive'} failed`,
                needsAuth: shouldRetry,
                timestamp: Date.now()
            };
        } finally {
            setLoading(false);
        }
    };

    const batchArchiveHabits = async (
        habitIds: string[],
        archive: boolean
    ): Promise<BatchOperationResult> => {
        const results = await Promise.allSettled(
            habitIds.map(id => archiveHabit(id, archive))
        );

        let successful = 0;
        let failed = 0;
        const errors: string[] = [];
        let needsAuth = false;

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successful++;
            } else {
                failed++;
                const error = result.status === 'rejected'
                    ? result.reason
                    : result.value.error;
                errors.push(`Habit ${habitIds[index]}: ${error}`);

                if (result.status === 'fulfilled' && result.value.needsAuth) {
                    needsAuth = true;
                }
            }
        });

        return { successful, failed, errors, needsAuth };
    };

    const batchDeleteHabits = async (habitIds: string[]): Promise<BatchOperationResult> => {
        const results = await Promise.allSettled(
            habitIds.map(id => deleteHabit(id))
        );

        let successful = 0;
        let failed = 0;
        const errors: string[] = [];
        let needsAuth = false;

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successful++;
            } else {
                failed++;
                const error = result.status === 'rejected'
                    ? result.reason
                    : result.value.error;
                errors.push(`Habit ${habitIds[index]}: ${error}`);

                if (result.status === 'fulfilled' && result.value.needsAuth) {
                    needsAuth = true;
                }
            }
        });

        return { successful, failed, errors, needsAuth };
    };

    return {
        createHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        updateDailyHabit,
        batchArchiveHabits,
        batchDeleteHabits
    };
};