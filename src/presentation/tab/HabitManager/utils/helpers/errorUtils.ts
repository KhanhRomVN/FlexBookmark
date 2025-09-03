/**
 * 🚨 ERROR UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🎯 Xử lý và phân loại lỗi
 * ├── 📋 Error mapping và transformation
 * ├── 🔍 Phân tích lỗi từ các API
 * ├── 📊 Tạo thông báo lỗi thân thiện
 * └── 🛠️ Utility functions cho error handling
 */

/**
 * 🎯 Phân loại lỗi
 */
export enum ErrorCategory {
    NETWORK = 'network',
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    VALIDATION = 'validation',
    NOT_FOUND = 'not_found',
    RATE_LIMIT = 'rate_limit',
    SERVER = 'server',
    CLIENT = 'client',
    UNKNOWN = 'unknown'
}

/**
 * 📋 Thông tin chi tiết về lỗi
 */
export interface ErrorDetails {
    category: ErrorCategory;
    code: string;
    message: string;
    originalError?: any;
    timestamp: number;
    context?: Record<string, any>;
    retryable: boolean;
}

/**
 * 🎯 Tạo error details từ error object
 */
export const createErrorDetails = (
    error: any,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: Record<string, any>
): ErrorDetails => {
    const code = getErrorCode(error);
    const message = getErrorMessage(error);

    return {
        category,
        code,
        message,
        originalError: error,
        timestamp: Date.now(),
        context,
        retryable: isRetryableError(error, category)
    };
};

/**
 * 🔍 Phân tích và phân loại lỗi tự động
 */
export const analyzeError = (error: any, context?: Record<string, any>): ErrorDetails => {
    let category = ErrorCategory.UNKNOWN;

    // Phân loại dựa trên error properties
    if (isNetworkError(error)) {
        category = ErrorCategory.NETWORK;
    } else if (isAuthenticationError(error)) {
        category = ErrorCategory.AUTHENTICATION;
    } else if (isAuthorizationError(error)) {
        category = ErrorCategory.AUTHORIZATION;
    } else if (isValidationError(error)) {
        category = ErrorCategory.VALIDATION;
    } else if (isNotFoundError(error)) {
        category = ErrorCategory.NOT_FOUND;
    } else if (isRateLimitError(error)) {
        category = ErrorCategory.RATE_LIMIT;
    } else if (isServerError(error)) {
        category = ErrorCategory.SERVER;
    }

    return createErrorDetails(error, category, context);
};

/**
 * 🌐 Kiểm tra có phải lỗi network không
 */
export const isNetworkError = (error: any): boolean => {
    if (!error) return false;

    return error.message?.includes('network') ||
        error.message?.includes('Network') ||
        error.message?.includes('fetch') ||
        error.message?.includes('connection') ||
        error.message?.includes('offline') ||
        error.code === 'NETWORK_ERROR' ||
        error.name === 'NetworkError' ||
        (error.response === undefined && error.request !== undefined) ||
        error.status === 0;
};

/**
 * 🔐 Kiểm tra có phải lỗi authentication không
 */
export const isAuthenticationError = (error: any): boolean => {
    if (!error) return false;

    return error.message?.includes('auth') ||
        error.message?.includes('login') ||
        error.message?.includes('token') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('unauthenticated') ||
        error.code === 'UNAUTHENTICATED' ||
        error.status === 401;
};

/**
 * 🚫 Kiểm tra có phải lỗi authorization không
 */
export const isAuthorizationError = (error: any): boolean => {
    if (!error) return false;

    return error.message?.includes('permission') ||
        error.message?.includes('access denied') ||
        error.message?.includes('forbidden') ||
        error.message?.includes('scope') ||
        error.code === 'PERMISSION_DENIED' ||
        error.status === 403;
};

/**
 * ✅ Kiểm tra có phải lỗi validation không
 */
export const isValidationError = (error: any): boolean => {
    if (!error) return false;

    return error.message?.includes('valid') ||
        error.message?.includes('invalid') ||
        error.message?.includes('require') ||
        error.message?.includes('missing') ||
        error.code === 'VALIDATION_ERROR' ||
        error.status === 400;
};

/**
 * 🔍 Kiểm tra có phải lỗi not found không
 */
export const isNotFoundError = (error: any): boolean => {
    if (!error) return false;

    return error.message?.includes('not found') ||
        error.message?.includes('not exist') ||
        error.message?.includes('404') ||
        error.code === 'NOT_FOUND' ||
        error.status === 404;
};

/**
 * ⏱️ Kiểm tra có phải lỗi rate limit không
 */
export const isRateLimitError = (error: any): boolean => {
    if (!error) return false;

    return error.message?.includes('rate limit') ||
        error.message?.includes('too many') ||
        error.message?.includes('quota') ||
        error.code === 'RATE_LIMIT_EXCEEDED' ||
        error.status === 429;
};

/**
 * 🖥️ Kiểm tra có phải lỗi server không
 */
export const isServerError = (error: any): boolean => {
    if (!error) return false;

    return error.message?.includes('server') ||
        error.message?.includes('internal') ||
        error.status >= 500;
};

/**
 * 🔄 Kiểm tra lỗi có thể retry không
 */
export const isRetryableError = (_error: any, category: ErrorCategory): boolean => {
    switch (category) {
        case ErrorCategory.NETWORK:
        case ErrorCategory.RATE_LIMIT:
        case ErrorCategory.SERVER:
            return true;
        case ErrorCategory.AUTHENTICATION:
        case ErrorCategory.AUTHORIZATION:
        case ErrorCategory.VALIDATION:
        case ErrorCategory.NOT_FOUND:
        case ErrorCategory.CLIENT:
        case ErrorCategory.UNKNOWN:
            return false;
        default:
            return false;
    }
};

/**
 * 🔍 Lấy error code từ error object
 */
export const getErrorCode = (error: any): string => {
    if (!error) return 'UNKNOWN_ERROR';

    if (error.code) return error.code;
    if (error.status) return `HTTP_${error.status}`;
    if (error.name && error.name !== 'Error') return error.name;

    return 'UNKNOWN_ERROR';
};

/**
 * 📝 Lấy error message từ error object
 */
export const getErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred';

    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error && typeof error.error === 'string') return error.error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;

    return 'An unknown error occurred';
};

/**
 * 🎯 Tạo user-friendly error message
 */
export const getUserFriendlyMessage = (errorDetails: ErrorDetails): string => {
    const { category, message } = errorDetails;

    switch (category) {
        case ErrorCategory.NETWORK:
            return 'Network connection issue. Please check your internet connection and try again.';

        case ErrorCategory.AUTHENTICATION:
            return 'Authentication failed. Please sign in again.';

        case ErrorCategory.AUTHORIZATION:
            return 'You don\'t have permission to perform this action.';

        case ErrorCategory.VALIDATION:
            return message || 'Invalid data provided. Please check your input and try again.';

        case ErrorCategory.NOT_FOUND:
            return 'The requested resource was not found.';

        case ErrorCategory.RATE_LIMIT:
            return 'Too many requests. Please wait a moment and try again.';

        case ErrorCategory.SERVER:
            return 'Server error. Please try again later.';

        case ErrorCategory.CLIENT:
            return 'Something went wrong. Please check your input and try again.';

        case ErrorCategory.UNKNOWN:
        default:
            return message || 'An unexpected error occurred. Please try again.';
    }
};

/**
 * 📊 Log error với đầy đủ thông tin
 */
export const logError = (errorDetails: ErrorDetails, level: 'error' | 'warn' | 'info' = 'error'): void => {
    const { category, code, message, timestamp, context, retryable } = errorDetails;

    const logEntry = {
        category,
        code,
        message,
        timestamp: new Date(timestamp).toISOString(),
        context,
        retryable
    };

    switch (level) {
        case 'error':
            console.error('🚨 Error occurred:', logEntry);
            break;
        case 'warn':
            console.warn('⚠️ Warning:', logEntry);
            break;
        case 'info':
            console.info('ℹ️ Info:', logEntry);
            break;
    }
};

/**
 * 🔄 Tạo retry strategy cho lỗi
 */
export const createRetryStrategy = (errorDetails: ErrorDetails): { shouldRetry: boolean; delay: number } => {
    const { category, retryable } = errorDetails;

    if (!retryable) {
        return { shouldRetry: false, delay: 0 };
    }

    // Exponential backoff based on error category
    let baseDelay = 1000; // 1 second

    switch (category) {
        case ErrorCategory.NETWORK:
            baseDelay = 2000; // 2 seconds
            break;
        case ErrorCategory.RATE_LIMIT:
            baseDelay = 5000; // 5 seconds
            break;
        case ErrorCategory.SERVER:
            baseDelay = 3000; // 3 seconds
            break;
    }

    return { shouldRetry: true, delay: baseDelay };
};

/**
 * 🎯 Wrap function với error handling
 */
export const withErrorHandling = async <T>(
    fn: () => Promise<T>,
    context?: Record<string, any>,
    onError?: (errorDetails: ErrorDetails) => void
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        const errorDetails = analyzeError(error, context);

        logError(errorDetails);

        if (onError) {
            onError(errorDetails);
        }

        throw errorDetails;
    }
};

export default {
    ErrorCategory,
    createErrorDetails,
    analyzeError,
    isNetworkError,
    isAuthenticationError,
    isAuthorizationError,
    isValidationError,
    isNotFoundError,
    isRateLimitError,
    isServerError,
    isRetryableError,
    getErrorCode,
    getErrorMessage,
    getUserFriendlyMessage,
    logError,
    createRetryStrategy,
    withErrorHandling
};