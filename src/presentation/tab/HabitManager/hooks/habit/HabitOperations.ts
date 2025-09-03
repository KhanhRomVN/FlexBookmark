/**
 * 🎯 HABIT OPERATIONS MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🏗️ Quản lý các thao tác CRUD cho thói quen
 * ├── 🔄 Xử lý đồng bộ hóa với Google Sheets
 * ├── 🎯 Quản lý tracking hàng ngày và streaks
 * ├── 🗂️ Batch operations (archive/delete nhiều habits)
 * ├── 🛡️ Error handling và auto-recovery
 * └── 📊 State management với optimistic updates
 * 
 * 🏗️ CẤU TRÚC CHÍNH:
 * ├── CRUD Operations     → Create, Read, Update, Delete habits
 * ├── Daily Tracking      → Cập nhật tracking hàng ngày
 * ├── Batch Operations    → Xử lý nhiều habits cùng lúc
 * ├── Error Handling      → Xử lý lỗi và retry logic
 * ├── State Management    → Quản lý state với optimistic updates
 * └── Auth Integration    → Tích hợp với authentication system
 * 
 * 🔧 CÁC CHỨC NĂNG CHÍNH:
 * ├── createHabit()       → Tạo habit mới
 * ├── updateHabit()       → Cập nhật habit
 * ├── deleteHabit()       → Xóa habit
 * ├── updateDailyHabit()  → Cập nhật tracking hàng ngày
 * ├── archiveHabit()      → Archive/unarchive habit
 * ├── batchArchiveHabits()→ Archive nhiều habits
 * ├── batchDeleteHabits() → Xóa nhiều habits
 * └── handleError()       → Xử lý lỗi thống nhất
 */

// 📚 IMPORTS & TYPES
// ════════════════════════════════════════════════════════════════════════════════

import type { Habit, HabitFormData } from '../../types/habit';
import { HabitUtils } from '../../utils/habit/HabitUtils';
import type { HabitOperationResult, BatchOperationResult } from '../../types/drive';

// 📋 INTERFACE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

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

// 🏭 MAIN OPERATIONS FACTORY
// ════════════════════════════════════════════════════════════════════════════════

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

    // ========== 🛠️ UTILITIES ==========

    /**
     * 🆔 Tạo ID duy nhất cho habit mới
     * @private
     * @returns {string} Unique habit ID
     */
    const generateHabitId = (): string => {
        return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    /**
     * 🛡️ Xử lý lỗi thống nhất với auth diagnosis
     * @private
     * @param error - Error object
     * @param operation - Tên operation gây lỗi
     * @returns {Promise<boolean>} True nếu cần retry
     */
    const handleError = async (error: any, operation: string): Promise<boolean> => {
        console.error(`❌ Error in ${operation}:`, error);

        // 🔍 Check auth-related errors
        const isAuthError = error?.message?.includes('401') ||
            error?.message?.includes('403') ||
            error?.message?.includes('invalid_grant') ||
            error?.status === 401 ||
            error?.status === 403;

        if (isAuthError) {
            // 🩺 Diagnose auth error
            const diagnostic = await diagnoseAuthError(error);

            if (!diagnostic.isHealthy) {
                const criticalIssues = diagnostic.issues.filter((i: { severity: string; }) => i.severity === 'critical');

                if (criticalIssues.length > 0) {
                    // 🔄 Try auto-recovery
                    const autoRecovered = await attemptAutoRecovery(diagnostic);

                    if (!autoRecovered) {
                        const errorMsg = `${operation} failed: ${diagnostic.recommendations.join(', ')}`;
                        setError(errorMsg);
                        return false;
                    }

                    // ✅ Auto-recovered, indicate retry
                    return true;
                }
            }
        }

        // ⚠️ Not auth-related or non-critical error
        const errorMessage = error instanceof Error ? error.message : `${operation} failed`;
        setError(errorMessage);
        return false;
    };

    // ========== 🏗️ CRUD OPERATIONS ==========

    /**
     * 🆕 Tạo habit mới
     * - Optimistic update local state
     * - Ghi vào Google Sheets
     * - Rollback nếu có lỗi
     * @param formData - Dữ liệu habit form
     * @returns {Promise<HabitOperationResult>} Kết quả operation
     */
    const createHabit = async (formData: HabitFormData): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        // 🏗️ Generate new habit object
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

            // ⚡ Optimistic update to local state
            setHabits(prev => [...prev, newHabit]);

            // 💾 Save to Google Sheets
            await habitUtils.writeHabit(currentSheetId, newHabit);

            console.log('✅ Habit created successfully:', newHabit.id);

            return {
                success: true,
                data: newHabit
            };

        } catch (error) {
            console.error('❌ Create habit failed:', error);

            // ↩️ Revert optimistic update
            setHabits(prev => prev.filter(h => h.id !== newHabit.id));

            const shouldRetry = await handleError(error, 'Create Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Create habit failed',
                needsAuth: shouldRetry
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✏️ Cập nhật habit hiện có
     * - Optimistic update local state
     * - Cập nhật Google Sheets
     * - Rollback nếu có lỗi
     * @param updatedHabit - Habit đã cập nhật
     * @returns {Promise<HabitOperationResult>} Kết quả operation
     */
    const updateHabit = async (updatedHabit: Habit): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        const originalHabit = habits.find(h => h.id === updatedHabit.id);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found'
            };
        }

        try {
            setLoading(true);
            setError(null);

            // ⚡ Optimistic update
            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));

            // 💾 Find habit index and update in Google Sheets
            const habitIndex = habits.findIndex(h => h.id === updatedHabit.id);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log('✅ Habit updated successfully:', updatedHabit.id);

            return {
                success: true,
                data: updatedHabit
            };

        } catch (error) {
            console.error('❌ Update habit failed:', error);

            // ↩️ Revert optimistic update
            setHabits(prev => prev.map(h => h.id === updatedHabit.id ? originalHabit : h));

            const shouldRetry = await handleError(error, 'Update Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update habit failed',
                needsAuth: shouldRetry
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * 🗑️ Xóa habit
     * - Optimistic update local state
     * - Xóa từ Google Sheets
     * - Rollback nếu có lỗi
     * @param habitId - ID habit cần xóa
     * @returns {Promise<HabitOperationResult>} Kết quả operation
     */
    const deleteHabit = async (habitId: string): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        const habitToDelete = habits.find(h => h.id === habitId);
        if (!habitToDelete) {
            return {
                success: false,
                error: 'Habit not found'
            };
        }

        try {
            setLoading(true);
            setError(null);

            // ⚡ Optimistic update
            setHabits(prev => prev.filter(h => h.id !== habitId));

            // 🗑️ Delete from Google Sheets
            await habitUtils.deleteHabit(currentSheetId, habitId);

            console.log('✅ Habit deleted successfully:', habitId);

            return {
                success: true
            };

        } catch (error) {
            console.error('❌ Delete habit failed:', error);

            // ↩️ Revert optimistic update
            setHabits(prev => [...prev, habitToDelete]);

            const shouldRetry = await handleError(error, 'Delete Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Delete habit failed',
                needsAuth: shouldRetry
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * 📅 Cập nhật daily habit tracking
     * - Cập nhật tracking value cho ngày cụ thể
     * - Recalculate streaks
     * - Cập nhật cả local state và Google Sheets
     * @param habitId - ID habit
     * @param day - Ngày trong tháng (1-31)
     * @param value - Giá trị tracking
     * @returns {Promise<HabitOperationResult>} Kết quả operation
     */
    const updateDailyHabit = async (
        habitId: string,
        day: number,
        value: number
    ): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        if (day < 1 || day > 31) {
            return {
                success: false,
                error: 'Day must be between 1 and 31'
            };
        }

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found'
            };
        }

        try {
            setError(null);

            // 📊 Update in Google Sheets and get back updated habit with recalculated streaks
            const updatedHabit = await habitUtils.updateDailyHabit(currentSheetId, habitId, day, value);

            if (updatedHabit) {
                // 🔄 Update local state with the updated habit
                setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
            }

            console.log('✅ Daily habit tracking updated successfully');

            return {
                success: true,
                data: updatedHabit
            };

        } catch (error) {
            console.error('❌ Update daily habit failed:', error);

            const shouldRetry = await handleError(error, 'Update Daily Habit');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update daily tracking failed',
                needsAuth: shouldRetry
            };
        }
    };

    /**
     * 📦 Archive/Unarchive habit
     * - Optimistic update local state
     * - Cập nhật Google Sheets
     * - Rollback nếu có lỗi
     * @param habitId - ID habit
     * @param archive - True để archive, false để unarchive
     * @returns {Promise<HabitOperationResult>} Kết quả operation
     */
    const archiveHabit = async (habitId: string, archive: boolean): Promise<HabitOperationResult> => {
        if (!habitUtils || !currentSheetId) {
            return {
                success: false,
                error: 'Drive not initialized',
                needsAuth: true
            };
        }

        const originalHabit = habits.find(h => h.id === habitId);
        if (!originalHabit) {
            return {
                success: false,
                error: 'Habit not found'
            };
        }

        try {
            setLoading(true);
            setError(null);

            // ⚡ Optimistic update
            const updatedHabit = { ...originalHabit, isArchived: archive };
            setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));

            // 💾 Update in Google Sheets
            const habitIndex = habits.findIndex(h => h.id === habitId);
            await habitUtils.writeHabit(currentSheetId, updatedHabit, habitIndex);

            console.log(`✅ Habit ${archive ? 'archived' : 'unarchived'} successfully:`, habitId);

            return {
                success: true,
                data: updatedHabit
            };

        } catch (error) {
            console.error(`❌ ${archive ? 'Archive' : 'Unarchive'} habit failed:`, error);

            // ↩️ Revert optimistic update
            setHabits(prev => prev.map(h => h.id === habitId ? originalHabit : h));

            const shouldRetry = await handleError(error, `${archive ? 'Archive' : 'Unarchive'} Habit`);
            return {
                success: false,
                error: error instanceof Error ? error.message : `${archive ? 'Archive' : 'Unarchive'} failed`,
                needsAuth: shouldRetry
            };
        } finally {
            setLoading(false);
        }
    };

    // ========== 📦 BATCH OPERATIONS ==========

    /**
     * 📦 Archive/Unarchive nhiều habits cùng lúc
     * - Xử lý parallel với Promise.allSettled
     * - Tổng hợp kết quả thành công/thất bại
     * @param habitIds - Mảng ID habits
     * @param archive - True để archive, false để unarchive
     * @returns {Promise<BatchOperationResult>} Kết quả batch operation
     */
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

    /**
     * 🗑️ Xóa nhiều habits cùng lúc
     * - Xử lý parallel với Promise.allSettled
     * - Tổng hợp kết quả thành công/thất bại
     * @param habitIds - Mảng ID habits
     * @returns {Promise<BatchOperationResult>} Kết quả batch operation
     */
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

    // ========== 🎯 RETURN OPERATIONS ==========

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