/**
 * 🎯 APPLICATION-WIDE CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 🎯 General application settings và configuration
 * ├── 📱 Responsive breakpoints và UI dimensions
 * ├── 🎨 Theme và styling constants
 * ├── 📊 Performance và optimization settings
 * └── 🔧 Development và debug settings
 */

// ========== APPLICATION INFO ==========

export const APP_INFO = {
    NAME: 'HabitTracker',
    VERSION: '1.0.0',
    DESCRIPTION: 'A comprehensive habit tracking and management system',
    AUTHOR: 'Your Team',
    REPOSITORY: 'https://github.com/your-username/habit-tracker'
} as const;

// ========== RESPONSIVE BREAKPOINTS ==========

export const BREAKPOINTS = {
    MOBILE: 640,
    TABLET: 768,
    LAPTOP: 1024,
    DESKTOP: 1280,
    LARGE_DESKTOP: 1536
} as const;

export const CONTAINER_SIZES = {
    MOBILE: '100%',
    TABLET: '90%',
    LAPTOP: '85%',
    DESKTOP: '80%',
    LARGE_DESKTOP: '75%'
} as const;

// ========== UI DIMENSIONS AND SPACING ==========

export const DIMENSIONS = {
    HEADER_HEIGHT: '64px',
    SIDEBAR_WIDTH: '280px',
    SIDEBAR_COLLAPSED_WIDTH: '80px',
    CONTENT_PADDING: '1rem',
    BORDER_RADIUS: '8px',
    CARD_PADDING: '1.5rem',
    MODAL_MAX_WIDTH: '500px',
    MODAL_MAX_HEIGHT: '80vh'
} as const;

export const SPACING = {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    XXL: '3rem'
} as const;

// ========== ANIMATION AND TRANSITION ==========

export const ANIMATION = {
    DURATION: {
        FAST: '150ms',
        NORMAL: '300ms',
        SLOW: '500ms'
    },
    EASING: {
        DEFAULT: 'ease-in-out',
        BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    DELAY: {
        SHORT: '100ms',
        MEDIUM: '200ms',
        LONG: '300ms'
    }
} as const;

// ========== Z-INDEX LAYERS ==========

export const Z_INDEX = {
    DROPDOWN: 1000,
    STICKY: 1020,
    MODAL: 1030,
    POPOVER: 1040,
    TOOLTIP: 1050,
    NOTIFICATION: 1060,
    LOADING: 1070
} as const;

// ========== PERFORMANCE SETTINGS ==========

export const PERFORMANCE = {
    DEBOUNCE: {
        SEARCH: 300,
        RESIZE: 100,
        SCROLL: 50
    },
    THROTTLE: {
        MOUSEMOVE: 100,
        SCROLL: 100,
        RESIZE: 200
    },
    LAZY_LOAD: {
        THRESHOLD: 0.1,
        ROOT_MARGIN: '50px'
    },
    CACHE: {
        DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
        LONG_TTL: 30 * 60 * 1000,   // 30 minutes
        SHORT_TTL: 60 * 1000        // 1 minute
    }
} as const;

// ========== ERROR BOUNDARY SETTINGS ==========

export const ERROR_BOUNDARY = {
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000,
    FALLBACK_MESSAGE: 'Something went wrong. Please try again.',
    REPORT_URL: '/api/error-report'
} as const;

// ========== DEVELOPMENT AND DEBUG SETTINGS ==========

export const DEVELOPMENT = {
    LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    ENABLE_REDUX_DEVTOOLS: process.env.NODE_ENV !== 'production',
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production'
} as const;

// ========== FEATURE FLAGS ==========

export const FEATURE_FLAGS = {
    ENABLE_OFFLINE_MODE: true,
    ENABLE_PUSH_NOTIFICATIONS: false,
    ENABLE_SOCIAL_FEATURES: false,
    ENABLE_ADVANCED_ANALYTICS: true,
    ENABLE_MULTI_DEVICE_SYNC: true
} as const;

// ========== INTERNATIONALIZATION ==========

export const I18N = {
    DEFAULT_LOCALE: 'en',
    SUPPORTED_LOCALES: ['en', 'vi', 'es', 'fr', 'de'],
    FALLBACK_LOCALE: 'en',
    LOADING_DELAY: 200
} as const;

// ========== ACCESSIBILITY SETTINGS ==========

export const ACCESSIBILITY = {
    SKIP_NAV_ID: 'skip-nav',
    MAIN_CONTENT_ID: 'main-content',
    FOCUS_VISIBLE: true,
    REDUCED_MOTION: false,
    HIGH_CONTRAST: false,
    FONT_SIZE: {
        NORMAL: '16px',
        LARGE: '18px',
        XLARGE: '20px'
    }
} as const;

// ========== SECURITY SETTINGS ==========

export const SECURITY = {
    CSRF_TOKEN_HEADER: 'X-CSRF-Token',
    JWT_EXPIRY: '24h',
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIREMENTS: {
        UPPERCASE: true,
        LOWERCASE: true,
        NUMBERS: true,
        SPECIAL: true
    },
    RATE_LIMITING: {
        MAX_REQUESTS: 100,
        WINDOW_MS: 15 * 60 * 1000 // 15 minutes
    }
} as const;

// ========== API CONFIGURATION ==========

export const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || '/api',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    VERSION: 'v1'
} as const;

export const API_ENDPOINTS = {
    HABITS: '/habits',
    HABITS_ID: '/habits/:id',
    HABITS_TRACK: '/habits/:id/track',
    HABITS_BATCH: '/habits/batch',
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_REFRESH: '/auth/refresh',
    USER_PROFILE: '/user/profile',
    USER_PREFERENCES: '/user/preferences'
} as const;

// ========== EXPORT TYPES ==========

export type Breakpoint = keyof typeof BREAKPOINTS;
export type SpacingSize = keyof typeof SPACING;
export type AnimationDuration = keyof typeof ANIMATION.DURATION;

export default {
    APP_INFO,
    BREAKPOINTS,
    CONTAINER_SIZES,
    DIMENSIONS,
    SPACING,
    ANIMATION,
    Z_INDEX,
    PERFORMANCE,
    ERROR_BOUNDARY,
    DEVELOPMENT,
    FEATURE_FLAGS,
    I18N,
    ACCESSIBILITY,
    SECURITY,
    API_CONFIG,
    API_ENDPOINTS
};