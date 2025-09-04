// src/presentation/tab/HabitManager/utils/helpers/validationUtils.ts

/**
 * ✅ VALIDATION UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🎯 Data validation và schema enforcement
 * ├── 📋 Form validation và error reporting
 * ├── 🔍 Input sanitization và normalization
 * ├── 📊 Validation rule management
 * └── 🛠️ Utility functions cho validation
 */

import { HabitType, DifficultyLevel, HabitCategory } from '../../types';
import { VALIDATION_RULES, TRACKING_SETTINGS } from '../../constant/habit.constants';

/**
 * 📋 Validation result structure
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fieldErrors: {
        [field: string]: string[];
    };
}

/**
 * 📋 Form validation result
 */
export interface FormValidationResult extends ValidationResult {
    isValid: boolean;
    errors: string[];
    fieldErrors: {
        [field: string]: string[];
    };
}

/**
 * 🎯 Validate habit form data
 */
export const validateHabitForm = (formData: any): FormValidationResult => {
    const result: FormValidationResult = {
        isValid: true,
        errors: [],
        fieldErrors: {},
        warnings: []
    };

    // 🎯 Validate name
    const nameValidation = validateHabitName(formData.name);
    if (!nameValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.name = nameValidation.errors;
    }

    // 🎯 Validate description
    const descriptionValidation = validateDescription(formData.description);
    if (!descriptionValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.description = descriptionValidation.errors;
    }

    // 🎯 Validate habit type
    const typeValidation = validateHabitType(formData.habitType);
    if (!typeValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.habitType = typeValidation.errors;
    }

    // 🎯 Validate difficulty level
    const difficultyValidation = validateDifficultyLevel(formData.difficultyLevel);
    if (!difficultyValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.difficultyLevel = difficultyValidation.errors;
    }

    // 🎯 Validate goal/limit based on habit type
    if (formData.habitType === 'good') {
        const goalValidation = validateGoal(formData.goal);
        if (!goalValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.goal = goalValidation.errors;
        }
    } else if (formData.habitType === 'bad') {
        const limitValidation = validateLimit(formData.limit);
        if (!limitValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.limit = limitValidation.errors;
        }
    }

    // 🎯 Validate category
    const categoryValidation = validateCategory(formData.category);
    if (!categoryValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.category = categoryValidation.errors;
    }

    // 🎯 Validate tags
    const tagsValidation = validateTags(formData.tags);
    if (!tagsValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.tags = tagsValidation.errors;
    }

    // 🎯 Validate color code
    const colorValidation = validateColorCode(formData.colorCode);
    if (!colorValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.colorCode = colorValidation.errors;
    }

    // 🎯 Validate unit if quantifiable
    if (formData.isQuantifiable) {
        const unitValidation = validateUnit(formData.unit);
        if (!unitValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.unit = unitValidation.errors;
        }
    }

    return result;
};

/**
 * 🔍 Validate habit name
 */
export const validateHabitName = (name: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!name || name.trim().length === 0) {
        result.isValid = false;
        result.errors.push('Habit name is required');
        return result;
    }

    const trimmedName = name.trim();

    if (trimmedName.length < VALIDATION_RULES.HABIT_NAME.MIN_LENGTH) {
        result.isValid = false;
        result.errors.push(`Habit name must be at least ${VALIDATION_RULES.HABIT_NAME.MIN_LENGTH} character(s) long`);
    }

    if (trimmedName.length > VALIDATION_RULES.HABIT_NAME.MAX_LENGTH) {
        result.isValid = false;
        result.errors.push(`Habit name cannot exceed ${VALIDATION_RULES.HABIT_NAME.MAX_LENGTH} characters`);
    }

    if (VALIDATION_RULES.HABIT_NAME.PATTERN && !VALIDATION_RULES.HABIT_NAME.PATTERN.test(trimmedName)) {
        result.isValid = false;
        result.errors.push(VALIDATION_RULES.HABIT_NAME.PATTERN_MESSAGE);
    }

    return result;
};

/**
 * 📝 Validate description
 */
export const validateDescription = (description?: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!description) {
        return result; // Description is optional
    }

    if (description.length > VALIDATION_RULES.DESCRIPTION.MAX_LENGTH) {
        result.isValid = false;
        result.errors.push(`Description cannot exceed ${VALIDATION_RULES.DESCRIPTION.MAX_LENGTH} characters`);
    }

    return result;
};

/**
 * 🎯 Validate habit type
 */
export const validateHabitType = (type: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!type) {
        result.isValid = false;
        result.errors.push('Habit type is required');
        return result;
    }

    const validTypes = Object.values(HabitType);
    if (!validTypes.includes(type as HabitType)) {
        result.isValid = false;
        result.errors.push(`Invalid habit type. Must be one of: ${validTypes.join(', ')}`);
    }

    return result;
};

/**
 * ⚡ Validate difficulty level
 */
export const validateDifficultyLevel = (level: number): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (level === undefined || level === null) {
        result.isValid = false;
        result.errors.push('Difficulty level is required');
        return result;
    }

    const validLevels = Object.values(DifficultyLevel).filter(v => typeof v === 'number');
    if (!validLevels.includes(level)) {
        result.isValid = false;
        result.errors.push(`Invalid difficulty level. Must be one of: ${validLevels.join(', ')}`);
    }

    return result;
};

/**
 * 🎯 Validate goal for good habits
 */
export const validateGoal = (goal?: number): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (goal === undefined || goal === null) {
        if (VALIDATION_RULES.GOAL.REQUIRED_FOR_GOOD_HABITS) {
            result.isValid = false;
            result.errors.push('Goal is required for good habits');
        }
        return result;
    }

    if (typeof goal !== 'number' || isNaN(goal)) {
        result.isValid = false;
        result.errors.push('Goal must be a valid number');
        return result;
    }

    if (goal < VALIDATION_RULES.GOAL.MIN) {
        result.isValid = false;
        result.errors.push(`Goal must be at least ${VALIDATION_RULES.GOAL.MIN}`);
    }

    if (goal > VALIDATION_RULES.GOAL.MAX) {
        result.isValid = false;
        result.errors.push(`Goal cannot exceed ${VALIDATION_RULES.GOAL.MAX}`);
    }

    if (!Number.isInteger(goal)) {
        result.warnings.push('Goal should be a whole number for better tracking');
    }

    return result;
};

/**
 * 🚫 Validate limit for bad habits
 */
export const validateLimit = (limit?: number): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (limit === undefined || limit === null) {
        if (VALIDATION_RULES.LIMIT.REQUIRED_FOR_BAD_HABITS) {
            result.isValid = false;
            result.errors.push('Limit is required for bad habits');
        }
        return result;
    }

    if (typeof limit !== 'number' || isNaN(limit)) {
        result.isValid = false;
        result.errors.push('Limit must be a valid number');
        return result;
    }

    if (limit < VALIDATION_RULES.LIMIT.MIN) {
        result.isValid = false;
        result.errors.push(`Limit must be at least ${VALIDATION_RULES.LIMIT.MIN}`);
    }

    if (limit > VALIDATION_RULES.LIMIT.MAX) {
        result.isValid = false;
        result.errors.push(`Limit cannot exceed ${VALIDATION_RULES.LIMIT.MAX}`);
    }

    if (!Number.isInteger(limit)) {
        result.warnings.push('Limit should be a whole number for better tracking');
    }

    return result;
};

/**
 * 📂 Validate category
 */
export const validateCategory = (category: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!category) {
        result.isValid = false;
        result.errors.push('Category is required');
        return result;
    }

    const validCategories = Object.values(HabitCategory);
    if (!validCategories.includes(category as HabitCategory)) {
        result.isValid = false;
        result.errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    return result;
};

/**
 * 🏷️ Validate tags
 */
export const validateTags = (tags?: string[]): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!tags) {
        return result; // Tags are optional
    }

    if (!Array.isArray(tags)) {
        result.isValid = false;
        result.errors.push('Tags must be an array');
        return result;
    }

    // Sử dụng TRACKING_SETTINGS.MAX_TAGS_PER_HABIT thay vì VALIDATION_RULES.MAX_TAGS_PER_HABIT
    if (tags.length > TRACKING_SETTINGS.MAX_TAGS_PER_HABIT) {
        result.isValid = false;
        result.errors.push(`Cannot have more than ${TRACKING_SETTINGS.MAX_TAGS_PER_HABIT} tags`);
    }

    tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
            result.isValid = false;
            result.errors.push(`Tag at index ${index} must be a string`);
        } else if (tag.trim().length === 0) {
            result.isValid = false;
            result.errors.push(`Tag at index ${index} cannot be empty`);
        } else if (tag.length > 50) {
            result.isValid = false;
            result.errors.push(`Tag at index ${index} cannot exceed 50 characters`);
        }
    });

    // Check for duplicate tags
    const uniqueTags = new Set(tags.map(tag => tag.toLowerCase().trim()));
    if (uniqueTags.size !== tags.length) {
        result.warnings.push('Duplicate tags found');
    }

    return result;
};

/**
 * 🎨 Validate color code
 */
export const validateColorCode = (colorCode?: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!colorCode) {
        return result; // Color code is optional, will use default
    }

    // Simple hex color validation
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(colorCode)) {
        result.isValid = false;
        result.errors.push('Color code must be a valid hex color (e.g., #3b82f6)');
    }

    return result;
};

/**
 * 📏 Validate unit
 */
export const validateUnit = (unit?: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!unit) {
        return result; // Unit is optional if not quantifiable
    }

    if (typeof unit !== 'string') {
        result.isValid = false;
        result.errors.push('Unit must be a string');
        return result;
    }

    if (unit.trim().length === 0) {
        result.isValid = false;
        result.errors.push('Unit cannot be empty');
    }

    if (unit.length > 20) {
        result.isValid = false;
        result.errors.push('Unit cannot exceed 20 characters');
    }

    return result;
};

/**
 * 🔄 Validate subtasks
 */
export const validateSubtasks = (subtasks?: string[]): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!subtasks) {
        return result; // Subtasks are optional
    }

    if (!Array.isArray(subtasks)) {
        result.isValid = false;
        result.errors.push('Subtasks must be an array');
        return result;
    }

    // Sử dụng TRACKING_SETTINGS.MAX_SUBTASKS_PER_HABIT thay vì VALIDATION_RULES.MAX_SUBTASKS_PER_HABIT
    if (subtasks.length > TRACKING_SETTINGS.MAX_SUBTASKS_PER_HABIT) {
        result.isValid = false;
        result.errors.push(`Cannot have more than ${TRACKING_SETTINGS.MAX_SUBTASKS_PER_HABIT} subtasks`);
    }

    subtasks.forEach((subtask, index) => {
        if (typeof subtask !== 'string') {
            result.isValid = false;
            result.errors.push(`Subtask at index ${index} must be a string`);
        } else if (subtask.trim().length === 0) {
            result.isValid = false;
            result.errors.push(`Subtask at index ${index} cannot be empty`);
        } else if (subtask.length > 100) {
            result.isValid = false;
            result.errors.push(`Subtask at index ${index} cannot exceed 100 characters`);
        }
    });

    return result;
};

/**
 * ⏰ Validate start time
 */
export const validateStartTime = (startTime?: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!startTime) {
        return result; // Start time is optional
    }

    // Simple time format validation (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
        result.isValid = false;
        result.errors.push('Start time must be in HH:mm format (e.g., 09:30)');
    }

    return result;
};

/**
 * 🧪 Validate complete habit object
 */
export const validateHabit = (habit: any): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };

    if (!habit || typeof habit !== 'object') {
        result.isValid = false;
        result.errors.push('Habit must be an object');
        return result;
    }

    // Validate required fields
    const requiredFields = ['id', 'name', 'habitType', 'difficultyLevel', 'category'];
    requiredFields.forEach(field => {
        if (!(field in habit)) {
            result.isValid = false;
            result.errors.push(`${field} is required`);
        }
    });

    // Validate individual fields
    const nameValidation = validateHabitName(habit.name);
    if (!nameValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.name = nameValidation.errors;
    }

    const typeValidation = validateHabitType(habit.habitType);
    if (!typeValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.habitType = typeValidation.errors;
    }

    const difficultyValidation = validateDifficultyLevel(habit.difficultyLevel);
    if (!difficultyValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.difficultyLevel = difficultyValidation.errors;
    }

    const categoryValidation = validateCategory(habit.category);
    if (!categoryValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.category = categoryValidation.errors;
    }

    // Validate type-specific fields
    if (habit.habitType === 'good') {
        const goalValidation = validateGoal(habit.goal);
        if (!goalValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.goal = goalValidation.errors;
        }
    } else if (habit.habitType === 'bad') {
        const limitValidation = validateLimit(habit.limit);
        if (!limitValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.limit = limitValidation.errors;
        }
    }

    // Validate optional fields
    if (habit.description !== undefined) {
        const descriptionValidation = validateDescription(habit.description);
        if (!descriptionValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.description = descriptionValidation.errors;
        }
    }

    if (habit.tags !== undefined) {
        const tagsValidation = validateTags(habit.tags);
        if (!tagsValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.tags = tagsValidation.errors;
        }
    }

    if (habit.colorCode !== undefined) {
        const colorValidation = validateColorCode(habit.colorCode);
        if (!colorValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.colorCode = colorValidation.errors;
        }
    }

    if (habit.unit !== undefined) {
        const unitValidation = validateUnit(habit.unit);
        if (!unitValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.unit = unitValidation.errors;
        }
    }

    if (habit.startTime !== undefined) {
        const timeValidation = validateStartTime(habit.startTime);
        if (!timeValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.startTime = timeValidation.errors;
        }
    }

    if (habit.subtasks !== undefined) {
        const subtasksValidation = validateSubtasks(habit.subtasks);
        if (!subtasksValidation.isValid) {
            result.isValid = false;
            result.fieldErrors.subtasks = subtasksValidation.errors;
        }
    }

    return result;
};

/**
 * 🔄 Sanitize habit data
 */
export const sanitizeHabitData = (data: any): any => {
    const sanitized: any = { ...data };

    // Trim string fields
    if (typeof sanitized.name === 'string') {
        sanitized.name = sanitized.name.trim();
    }
    if (typeof sanitized.description === 'string') {
        sanitized.description = sanitized.description.trim();
    }
    if (typeof sanitized.unit === 'string') {
        sanitized.unit = sanitized.unit.trim();
    }
    if (typeof sanitized.startTime === 'string') {
        sanitized.startTime = sanitized.startTime.trim();
    }
    if (typeof sanitized.colorCode === 'string') {
        sanitized.colorCode = sanitized.colorCode.trim();
    }

    // Sanitize tags
    if (Array.isArray(sanitized.tags)) {
        sanitized.tags = sanitized.tags
            .filter((tag: any) => typeof tag === 'string')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0);
    }

    // Sanitize subtasks
    if (Array.isArray(sanitized.subtasks)) {
        sanitized.subtasks = sanitized.subtasks
            .filter((subtask: any) => typeof subtask === 'string')
            .map((subtask: string) => subtask.trim())
            .filter((subtask: string) => subtask.length > 0);
    }

    // Ensure numeric fields are numbers
    if (sanitized.difficultyLevel !== undefined) {
        sanitized.difficultyLevel = Number(sanitized.difficultyLevel);
    }
    if (sanitized.goal !== undefined) {
        sanitized.goal = Number(sanitized.goal);
    }
    if (sanitized.limit !== undefined) {
        sanitized.limit = Number(sanitized.limit);
    }

    return sanitized;
};

/**
 * 🎯 Normalize habit data for consistency
 */
export const normalizeHabitData = (data: any): any => {
    const normalized = { ...data };

    // Set default values for optional fields
    if (normalized.description === undefined) {
        normalized.description = '';
    }
    if (normalized.tags === undefined) {
        normalized.tags = [];
    }
    if (normalized.colorCode === undefined) {
        normalized.colorCode = '#3b82f6';
    }
    if (normalized.unit === undefined) {
        normalized.unit = '';
    }
    if (normalized.startTime === undefined) {
        normalized.startTime = '';
    }
    if (normalized.subtasks === undefined) {
        normalized.subtasks = [];
    }
    if (normalized.isQuantifiable === undefined) {
        normalized.isQuantifiable = false;
    }
    if (normalized.isArchived === undefined) {
        normalized.isArchived = false;
    }

    // Ensure category is lowercase
    if (typeof normalized.category === 'string') {
        normalized.category = normalized.category.toLowerCase();
    }

    // Ensure habit type is lowercase
    if (typeof normalized.habitType === 'string') {
        normalized.habitType = normalized.habitType.toLowerCase();
    }

    return normalized;
};

/**
 * 📊 Get validation error messages
 */
export const getValidationMessages = (validationResult: ValidationResult): string[] => {
    const messages: string[] = [];

    // Add general errors
    messages.push(...validationResult.errors);

    // Add field-specific errors
    Object.values(validationResult.fieldErrors).forEach(fieldErrors => {
        messages.push(...fieldErrors);
    });

    // Add warnings
    if (validationResult.warnings.length > 0) {
        messages.push(...validationResult.warnings.map(warning => `⚠️ ${warning}`));
    }

    return messages;
};

/**
 * 🎯 Check if validation has errors
 */
export const hasValidationErrors = (validationResult: ValidationResult): boolean => {
    return validationResult.errors.length > 0 ||
        Object.values(validationResult.fieldErrors).some(errors => errors.length > 0);
};

/**
 * 🔄 Create a validation result from errors
 */
export const createValidationResult = (errors: string[], fieldErrors?: { [field: string]: string[] }): ValidationResult => {
    return {
        isValid: errors.length === 0 && (!fieldErrors || Object.values(fieldErrors).every(e => e.length === 0)),
        errors,
        warnings: [],
        fieldErrors: fieldErrors || {}
    };
};

/**
 * ✅ Create a successful validation result
 */
export const createSuccessValidationResult = (): ValidationResult => {
    return {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {}
    };
};

export default {
    validateHabitForm,
    validateHabitName,
    validateDescription,
    validateHabitType,
    validateDifficultyLevel,
    validateGoal,
    validateLimit,
    validateCategory,
    validateTags,
    validateColorCode,
    validateUnit,
    validateSubtasks,
    validateStartTime,
    validateHabit,
    sanitizeHabitData,
    normalizeHabitData,
    getValidationMessages,
    hasValidationErrors,
    createValidationResult,
    createSuccessValidationResult
};