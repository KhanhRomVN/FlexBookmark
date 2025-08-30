import type { Habit, HabitFormData } from '../../types/habit';

export class HabitValidator {
    static validateHabitFormData(formData: HabitFormData): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields
        if (!formData.name.trim()) {
            errors.push('Habit name is required');
        }

        if (formData.name.length > 100) {
            errors.push('Habit name must be 100 characters or less');
        }

        // Validate goal/limit based on habit type
        if (formData.habitType === 'good' && formData.isQuantifiable) {
            if (!formData.goal || formData.goal <= 0) {
                errors.push('Goal must be greater than 0 for good habits');
            }
        }

        if (formData.habitType === 'bad' && formData.isQuantifiable) {
            if (formData.limit === undefined || formData.limit < 0) {
                errors.push('Limit must be 0 or greater for bad habits');
            }
        }

        // Validate difficulty level
        if (formData.difficultyLevel < 1 || formData.difficultyLevel > 5) {
            errors.push('Difficulty level must be between 1 and 5');
        }

        // Validate time format if provided
        if (formData.startTime && !this.isValidTimeFormat(formData.startTime)) {
            errors.push('Start time must be in HH:MM format');
        }

        // Validate tags
        if (formData.tags.some(tag => tag.length > 20)) {
            errors.push('Tags must be 20 characters or less');
        }

        // Validate subtasks
        if (formData.subtasks.some(subtask => subtask.length > 100)) {
            errors.push('Subtasks must be 100 characters or less');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateHabit(habit: Habit): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Basic required fields
        if (!habit.id) {
            errors.push('Habit ID is required');
        }

        if (!habit.name.trim()) {
            errors.push('Habit name is required');
        }

        // Validate daily tracking array
        if (habit.dailyTracking.length !== 31) {
            errors.push('Daily tracking array must have exactly 31 entries');
        }

        // Validate tracking values
        habit.dailyTracking.forEach((value, index) => {
            if (value !== null && (typeof value !== 'number' || isNaN(value) || value < 0)) {
                errors.push(`Invalid tracking value at day ${index + 1}`);
            }
        });

        // Validate streaks
        if (habit.currentStreak < 0) {
            errors.push('Current streak cannot be negative');
        }

        if (habit.longestStreak < 0) {
            errors.push('Longest streak cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private static isValidTimeFormat(time: string): boolean {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    static sanitizeHabitFormData(formData: HabitFormData): HabitFormData {
        return {
            ...formData,
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            tags: formData.tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
            subtasks: formData.subtasks.map(subtask => subtask.trim()).filter(subtask => subtask.length > 0),
            unit: formData.unit?.trim() || '',
            startTime: formData.startTime?.trim() || ''
        };
    }
}