export const CACHE_KEYS = {
    // Habit data
    HABITS: 'habits_cache',
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

    // Performance data
    LOAD_TIMES: 'load_times_cache',
    ERROR_LOG: 'error_log_cache'
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    HABITS: 5 * 60 * 1000,          // 5 minutes
    PERMISSIONS: 15 * 60 * 1000,     // 15 minutes
    AUTH: 30 * 60 * 1000,            // 30 minutes
    FOLDER_STRUCTURE: 60 * 60 * 1000, // 1 hour
    USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
    ERROR_LOG: 7 * 24 * 60 * 60 * 1000 // 7 days
} as const;