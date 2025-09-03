/**
 * 🔐 AUTHENTICATION CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 🎯 Core authentication constants và configuration
 * ├── 🔧 Service scopes và API endpoints
 * ├── ⚙️ Validation và timeout settings
 * ├── 📊 Error codes và messages
 * └── 🛠️ Utility constants
 */

// ========== GOOGLE API CONFIGURATION ==========

export const GOOGLE_APIS = {
    TOKEN_INFO: 'https://www.googleapis.com/oauth2/v1/tokeninfo',
    TOKEN_REVOKE: 'https://oauth2.googleapis.com/revoke',
    USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo',
    OAUTH_AUTHORIZE: 'https://accounts.google.com/oauth2/v2/auth'
} as const;

// ========== SERVICE SCOPES ==========

export const SERVICE_SCOPES = {
    CORE: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
    DRIVE: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ],
    SHEETS: [
        'https://www.googleapis.com/auth/spreadsheets'
    ],
    CALENDAR: [
        'https://www.googleapis.com/auth/calendar.events.readonly'
    ]
} as const;

// ========== VALIDATION CONSTANTS ==========

export const VALIDATION_INTERVALS = {
    PERIODIC: 5 * 60 * 1000,           // ⏰ 5 phút
    TOKEN_EXPIRY_BUFFER: 10 * 60 * 1000, // ⏰ 10 minutes buffer
    QUICK_VALIDATION: 60000,           // ⏰ 1 phút
    CACHE_TTL: 60000,                  // ⏰ 1 phút cache
    SCOPE_CACHE_TTL: 300000            // ⏰ 5 phút scope cache
} as const;

// ========== RETRY AND TIMEOUT SETTINGS ==========

export const RETRY_LIMITS = {
    MAX_TOKEN_REFRESH_ATTEMPTS: 3,
    MAX_VALIDATION_ATTEMPTS: 2,
    EXPONENTIAL_BACKOFF_BASE: 1000
} as const;

export const TIMEOUT_SETTINGS = {
    TOKEN_REFRESH_TIMEOUT: 30000,      // ⏱️ 30 giây
    API_TEST_TIMEOUT: 15000,           // ⏱️ 15 giây
    NETWORK_TEST_TIMEOUT: 5000,        // ⏱️ 5 giây
    VALIDATION_TIMEOUT: 10000          // ⏱️ 10 giây
} as const;

// ========== ERROR CODES AND MESSAGES ==========

export const AUTH_ERRORS = {
    NO_AUTH: 'no_auth',
    INVALID_TOKEN: 'invalid_token',
    TOKEN_EXPIRED: 'token_expired',
    MISSING_PERMISSIONS: 'missing_permissions',
    INSUFFICIENT_SCOPE: 'insufficient_scope',
    NETWORK_ERROR: 'network_error',
    PERMISSION_DENIED: 'permission_denied',
    CONSENT_REQUIRED: 'consent_required',
    UNKNOWN_ERROR: 'unknown_error'
} as const;

export const ERROR_MESSAGES = {
    [AUTH_ERRORS.NO_AUTH]: 'User not authenticated',
    [AUTH_ERRORS.INVALID_TOKEN]: 'Access token is invalid',
    [AUTH_ERRORS.TOKEN_EXPIRED]: 'Access token has expired',
    [AUTH_ERRORS.MISSING_PERMISSIONS]: 'Required permissions are missing',
    [AUTH_ERRORS.INSUFFICIENT_SCOPE]: 'Insufficient permissions for this operation',
    [AUTH_ERRORS.NETWORK_ERROR]: 'Network connectivity issue detected',
    [AUTH_ERRORS.PERMISSION_DENIED]: 'Permission denied for this operation',
    [AUTH_ERRORS.CONSENT_REQUIRED]: 'User consent is required for additional permissions',
    [AUTH_ERRORS.UNKNOWN_ERROR]: 'Unknown authentication error occurred'
} as const;

// ========== PERMISSION SCOPES CONFIGURATION ==========

export const PERMISSION_SCOPES: Array<{
    name: string;
    url: string;
    required: boolean;
    testEndpoint: string;
    description: string;
    category: 'storage' | 'calendar' | 'other';
    fallbackTest?: string;
}> = [
        {
            name: 'drive',
            url: 'https://www.googleapis.com/auth/drive.file',
            required: true,
            testEndpoint: 'https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)',
            fallbackTest: 'https://www.googleapis.com/drive/v3/about?fields=user',
            description: 'Access to Google Drive files for habit data storage',
            category: 'storage'
        },
        {
            name: 'sheets',
            url: 'https://www.googleapis.com/auth/spreadsheets',
            required: true,
            testEndpoint: 'https://sheets.googleapis.com/v4/spreadsheets?pageSize=1',
            fallbackTest: 'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
            description: 'Access to Google Sheets for habit tracking data',
            category: 'storage'
        },
        {
            name: 'calendar',
            url: 'https://www.googleapis.com/auth/calendar.events.readonly',
            required: false,
            testEndpoint: 'https://www.googleapis.com/calendar/v3/calendars/primary?fields=id',
            fallbackTest: 'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
            description: 'Read-only access to calendar events for habit scheduling',
            category: 'calendar'
        }
    ];

// ========== DEFAULT CONFIGURATION ==========

export const DEFAULT_AUTH_CONFIG = {
    requiredScopes: [
        ...SERVICE_SCOPES.CORE,
        ...SERVICE_SCOPES.DRIVE,
        ...SERVICE_SCOPES.SHEETS
    ],
    autoValidate: true,
    validationDelay: 3000,
    enableDiagnostics: true,
    enableAutoRecovery: true
} as const;

// ========== CACHE SETTINGS ==========

export const CACHE_SETTINGS = {
    VALIDATION_TTL: 60000,             // ⏰ 1 phút
    SCOPE_TEST_TTL: 300000,            // ⏰ 5 phút
    DIAGNOSTIC_TTL: 30000,             // ⏰ 30 giây
    MAX_CACHE_ENTRIES: 100
} as const;

// ========== DIAGNOSTIC SEVERITY LEVELS ==========

export const DIAGNOSTIC_SEVERITY = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    CRITICAL: 'critical',
    FATAL: 'fatal'
} as const;

// ========== AUTH STATE FLAGS ==========

export const AUTH_STATE_FLAGS = {
    IS_READY: 'isReady',
    IS_VALIDATING: 'isValidating',
    CAN_PROCEED: 'canProceed',
    TOKEN_REFRESH_IN_PROGRESS: 'tokenRefreshInProgress'
} as const;

// ========== EXPORT TYPES ==========

export type AuthErrorType = typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS];
export type DiagnosticSeverity = typeof DIAGNOSTIC_SEVERITY[keyof typeof DIAGNOSTIC_SEVERITY];
export type ServiceScope = keyof typeof SERVICE_SCOPES;

export default {
    GOOGLE_APIS,
    SERVICE_SCOPES,
    VALIDATION_INTERVALS,
    RETRY_LIMITS,
    TIMEOUT_SETTINGS,
    AUTH_ERRORS,
    ERROR_MESSAGES,
    PERMISSION_SCOPES,
    DEFAULT_AUTH_CONFIG,
    CACHE_SETTINGS,
    DIAGNOSTIC_SEVERITY,
    AUTH_STATE_FLAGS
};