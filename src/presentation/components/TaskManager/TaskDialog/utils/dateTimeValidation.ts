// src/presentation/components/TaskManager/TaskDialog/utils/dateTimeValidation.ts

export interface ValidationResult {
    isValid: boolean;
    type: 'valid' | 'invalid-range' | 'overdue';
    message?: string;
}

/**
 * Combines date and time into a single Date object
 */
export const combineDateTime = (date: Date | null, time: Date | null): Date | null => {
    if (!date) return null;

    const combined = new Date(date);

    if (time) {
        combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }

    return combined;
};

/**
 * Validates if due date/time is not before start date/time
 */
export const validateDateTimeRange = (
    startDate: Date | null,
    startTime: Date | null,
    dueDate: Date | null,
    dueTime: Date | null
): ValidationResult => {
    // If no dates are set, it's valid
    if (!startDate && !dueDate) {
        return { isValid: true, type: 'valid' };
    }

    // If only start date is set, it's valid
    if (startDate && !dueDate) {
        return { isValid: true, type: 'valid' };
    }

    // If only due date is set, it's valid
    if (!startDate && dueDate) {
        return { isValid: true, type: 'valid' };
    }

    // Both dates are set, validate range
    if (startDate && dueDate) {
        const startDateTime = combineDateTime(startDate, startTime);
        const dueDateTime = combineDateTime(dueDate, dueTime);

        if (startDateTime && dueDateTime && dueDateTime < startDateTime) {
            return {
                isValid: false,
                type: 'invalid-range',
                message: 'Due date/time cannot be before start date/time'
            };
        }
    }

    return { isValid: true, type: 'valid' };
};

/**
 * Validates if due date/time is in the past (overdue)
 */
export const validateOverdue = (
    dueDate: Date | null,
    dueTime: Date | null
): ValidationResult => {
    if (!dueDate) {
        return { isValid: true, type: 'valid' };
    }

    const now = new Date();
    const dueDateTime = combineDateTime(dueDate, dueTime);

    if (dueDateTime && dueDateTime < now) {
        return {
            isValid: false,
            type: 'overdue',
            message: 'Due date/time is in the past'
        };
    }

    return { isValid: true, type: 'valid' };
};

/**
 * Comprehensive validation that checks both range and overdue
 */
export const validateDateTime = (
    startDate: Date | null,
    startTime: Date | null,
    dueDate: Date | null,
    dueTime: Date | null
): ValidationResult => {
    // First check range validation
    const rangeValidation = validateDateTimeRange(startDate, startTime, dueDate, dueTime);
    if (!rangeValidation.isValid) {
        return rangeValidation;
    }

    // Then check overdue validation
    const overdueValidation = validateOverdue(dueDate, dueTime);
    if (!overdueValidation.isValid) {
        return overdueValidation;
    }

    return { isValid: true, type: 'valid' };
};

/**
 * Prevents setting due date/time before start date/time
 */
export const preventInvalidDueDateTime = (
    startDate: Date | null,
    startTime: Date | null,
    newDueDate: Date | null,
    newDueTime: Date | null
): { dueDate: Date | null; dueTime: Date | null } => {
    if (!startDate || !newDueDate) {
        return { dueDate: newDueDate, dueTime: newDueTime };
    }

    const startDateTime = combineDateTime(startDate, startTime);
    const dueDateTime = combineDateTime(newDueDate, newDueTime);

    if (startDateTime && dueDateTime && dueDateTime < startDateTime) {
        // Set due date/time to match start date/time
        return {
            dueDate: startDate,
            dueTime: startTime,
        };
    }

    return { dueDate: newDueDate, dueTime: newDueTime };
};