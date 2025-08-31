export const CACHE_KEYS = {
    // Month-based habit storage
    HABITS_CURRENT_MONTH: 'habits_current_month',
    HABITS_PREVIOUS_MONTH: 'habits_previous_month',
    CURRENT_MONTH_KEY: 'current_month_key',

    // Metadata
    HABITS_METADATA: 'habits_metadata_cache',

    // Authentication & permissions
    PERMISSIONS: 'permissions_cache',
    AUTH_VERIFIED: 'auth_verified_timestamp',
    USER_PROFILE: 'user_profile_cache',

    // Drive integration
    SHEET_ID: 'current_sheet_id',
    FOLDER_STRUCTURE: 'folder_structure_cache',

    // Sync management
    LAST_SYNC: 'last_sync_timestamp',
    SYNC_QUEUE: 'sync_queue_cache',
    LAST_CLEANUP: 'last_cleanup_timestamp',
    BACKGROUND_CHECK: 'background_check_status',

    // Performance data
    LOAD_TIMES: 'load_times_cache',
    ERROR_LOG: 'error_log_cache'
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    HABITS: 5 * 60 * 1000,          // 5 minutes
    HABITS_LONG: 30 * 60 * 1000,    // 30 minutes for monthly data
    PERMISSIONS: 15 * 60 * 1000,     // 15 minutes
    AUTH: 30 * 60 * 1000,            // 30 minutes
    FOLDER_STRUCTURE: 60 * 60 * 1000, // 1 hour
    USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
    ERROR_LOG: 7 * 24 * 60 * 60 * 1000, // 7 days
    BACKGROUND_CHECK: 5 * 60 * 1000  // 5 minutes
} as const;