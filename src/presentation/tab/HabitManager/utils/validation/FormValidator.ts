export class FormValidator {
    static validateRequired(value: string | undefined | null, fieldName: string): string | null {
        if (!value || !value.trim()) {
            return `${fieldName} is required`;
        }
        return null;
    }

    static validateLength(value: string, maxLength: number, fieldName: string): string | null {
        if (value.length > maxLength) {
            return `${fieldName} must be ${maxLength} characters or less`;
        }
        return null;
    }

    static validateNumericRange(
        value: number | undefined,
        min: number,
        max: number,
        fieldName: string
    ): string | null {
        if (value === undefined) return null;

        if (value < min || value > max) {
            return `${fieldName} must be between ${min} and ${max}`;
        }
        return null;
    }

    static validatePositiveNumber(value: number | undefined, fieldName: string): string | null {
        if (value === undefined) return null;

        if (value <= 0) {
            return `${fieldName} must be greater than 0`;
        }
        return null;
    }

    static validateNonNegativeNumber(value: number | undefined, fieldName: string): string | null {
        if (value === undefined) return null;

        if (value < 0) {
            return `${fieldName} cannot be negative`;
        }
        return null;
    }

    static validateArrayLength<T>(
        array: T[],
        maxLength: number,
        fieldName: string
    ): string | null {
        if (array.length > maxLength) {
            return `${fieldName} cannot have more than ${maxLength} items`;
        }
        return null;
    }

    static combineValidationResults(results: (string | null)[]): string[] {
        return results.filter((result): result is string => result !== null);
    }
}