// src/presentation/tab/HabitManager/contexts/types.ts

import { Habit, HabitFormData } from '../types';

// ========== AUTH CONTEXT TYPES ==========

export interface AuthContextValue {
    // Core state
    authState: any;
    validationStatus: any;
    permissions: any;

    // Loading states
    isCheckingPermissions: boolean;

    // Actions
    login: () => Promise<any>;
    logout: () => Promise<any>;
    forceReauth: () => Promise<any>;

    // Validation
    validateAuth: (force?: boolean) => Promise<any>;
    triggerValidation: () => void;
    refreshPermissions: () => Promise<any>;

    // Token management
    refreshAccessToken: () => Promise<any>;
    forceTokenRefresh: () => Promise<any>;

    // Status getters
    getAuthStatus: () => any;
    diagnoseAuthIssues: () => any;

    // Utility functions
    checkScope: (scope: string) => boolean;
    getRequiredScopes: () => string[];

    // Computed values
    isReady: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasError: boolean;

    // Permission shortcuts
    hasDriveAccess: boolean;
    hasSheetsAccess: boolean;
    hasCalendarAccess: boolean;
}

export interface EnhancedAuthState {
    isAuthenticated: boolean;
    user: any;
    loading: boolean;
    error: string | null;
    isValidating: boolean;
    canProceed: boolean;
    lastValidation: number | null;
    tokenRefreshInProgress: boolean;
    lastTokenRefresh: number | null;
    isReady: boolean;
    validationStatus: ValidationStatus;
}

export interface ValidationStatus {
    grantedScopes: never[];
    isExpired: boolean;
    isValid: boolean;
    hasValidToken: boolean;
    hasRequiredScopes: boolean;
    needsReauth: boolean;
    lastValidation: number | null;
    expiresAt: number | null;
    errors: string[];
    validationInProgress: boolean;
}

export interface PermissionStatus {
    hasDrive: boolean;
    hasSheets: boolean;
    hasCalendar: boolean;
    allRequired: boolean;
    folderStructureExists: boolean;
    checked: boolean;
    lastChecked: number | null;
    checkInProgress: boolean;
}

export interface AuthOperationResult {
    success: boolean;
    error?: string;
    needsAuth?: boolean;
}

export interface AuthStatus {
    isAuthenticated: boolean;
    user: any;
    loading: boolean;
    error: string | null;
    isReady: boolean;
    isValidating: boolean;
    lastValidation: number | null;
    hasToken: boolean;
    tokenValid: boolean;
    tokenExpired: boolean;
    tokenExpiry: number | null;
    hasRequiredScopes: boolean;
    hasDriveAccess: boolean;
    hasSheetsAccess: boolean;
    hasCalendarAccess: boolean;
    grantedScopes: string[];
    validationErrors: string[];
    scopeDetails: any[];
}

export interface AuthDiagnosticResult {
    isHealthy: boolean;
    severity: string;
    issues: any[];
    recommendations: string[];
    needsUserAction: boolean;
    canAutoRecover: boolean;
    systemStatus: any;
}

// ========== HABIT CONTEXT TYPES ==========

export interface HabitContextValue {
    // 📊 State
    habits: Habit[];
    loading: boolean;
    error: string | null;
    syncInProgress: boolean;
    initialized: boolean;
    currentSheetId: string | null;

    // 🎯 Operations
    createHabit: (formData: HabitFormData) => Promise<HabitOperationResult>;
    updateHabit: (habit: Habit) => Promise<HabitOperationResult>;
    deleteHabit: (habitId: string) => Promise<HabitOperationResult>;
    archiveHabit: (habitId: string, archive: boolean) => Promise<HabitOperationResult>;
    updateDailyHabit: (habitId: string, day: number, value: number) => Promise<HabitOperationResult>;
    syncHabits: (forceRefresh?: boolean) => Promise<SyncResult>;
    batchArchiveHabits: (habitIds: string[], archive: boolean) => Promise<BatchOperationResult>;
    batchDeleteHabits: (habitIds: string[]) => Promise<BatchOperationResult>;

    // 🔧 Utilities
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
    setHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;

    // 📈 Computed values
    isReady: boolean;
    habitCount: number;
    activeHabits: Habit[];
    archivedHabits: Habit[];
}

export interface HabitOperationResult {
    success: boolean;
    data?: Habit;
    error?: string;
    needsAuth?: boolean;
}

export interface BatchOperationResult {
    successful: number;
    failed: number;
    errors: Array<{ habitId: string; error: string }>;
    needsAuth?: boolean;
}

export interface SyncResult {
    success: boolean;
    habitsCount?: number;
    lastSync: number;
    changes: {
        added: number;
        updated: number;
        deleted: number;
    };
    error?: string;
    needsAuth?: boolean;
}

// ========== APP CONTEXT TYPES ==========

export interface AppContextValue {
    // 📊 State
    isOnline: boolean;
    isInitialized: boolean;
    settings: AppSettings;
    lastSync: number | null;
    errors: string[];

    // 🎯 Operations
    updateSettings: (settings: Partial<AppSettings>) => void;
    clearError: (index: number) => void;
    clearAllErrors: () => void;
    forceSync: () => Promise<void>;

    // 🔧 Utilities
    addError: (error: string) => void;
}

export interface AppSettings {
    theme: "light" | "dark" | "auto";
    language: string;
    notifications: {
        dailyReminder: boolean;
        weeklySummary: boolean;
        streakNotifications: boolean;
    };
    syncFrequency: number;
    offlineMode: boolean;
}