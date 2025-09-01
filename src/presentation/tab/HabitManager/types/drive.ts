import type { Habit, HabitFormData } from './habit';

// ========== GOOGLE DRIVE TYPES ==========

export interface DriveFolder {
    id: string;
    name: string;
    createdTime: string;
    modifiedTime: string;
}

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    parents: string[];
}

export interface SheetStructure {
    sheetId: string;
    title: string;
    headers: string[];
    rowCount: number;
    columnCount: number;
}

// ========== OPERATION TYPES ==========

export interface BatchOperation {
    operation: 'create' | 'update' | 'delete';
    habitId: string;
    data?: any;
}

export interface DriveSetupResult {
    success: boolean;
    sheetId: string | null;
    needsInitialSetup: boolean;
    error?: string;
}

export interface HabitOperationResult {
    success: boolean;
    data?: any;
    error?: string;
    needsAuth?: boolean;
}

export interface BatchOperationResult {
    successful: number;
    failed: number;
    errors: string[];
    needsAuth: boolean;
}

export interface SyncResult {
    success: boolean;
    habitsCount: number;
    lastSync: number;
    changes: {
        added: number;
        updated: number;
        deleted: number;
    };
    error?: string;
    needsAuth?: boolean;
}

// ========== CONSTANTS ==========

export class HabitConstants {
    static readonly FOLDER_NAME = 'HabitTracker';
    static readonly SHEET_NAME = 'Daily Habits Tracker';

    // Google API endpoints
    static readonly SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
    static readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

    // Sheet structure
    static readonly SHEET_HEADERS = [
        'ID', 'Name', 'Description', 'Type', 'Difficulty', 'Goal', 'Limit', 'Current Streak',
        // Days 1-31 for daily tracking
        ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
        // Additional properties
        'Created Date', 'Color Code', 'Longest Streak', 'Category', 'Tags',
        'Is Archived', 'Is Quantifiable', 'Unit', 'Start Time', 'Subtasks'
    ];
}

// ========== HOOK TYPES ==========

export interface UseHabitDependencies {
    isAuthReady: () => boolean;
    getAuthStatus: () => any;
    diagnoseAuthError: (error: any) => Promise<any>;
    attemptAutoRecovery: (diagnostic: any) => Promise<boolean>;
}

export interface UseHabitState {
    habitUtils: any | null;
    currentSheetId: string | null;
    habits: Habit[];
    loading: boolean;
    error: string | null;
    syncInProgress: boolean;
}

export interface UseHabitActions {
    initializeHabitUtils: (accessToken: string) => Promise<any | null>;
    setupDriveStructure: (forceNew?: boolean) => Promise<DriveSetupResult>;
    createHabit: (formData: HabitFormData) => Promise<HabitOperationResult>;
    updateHabit: (updatedHabit: Habit) => Promise<HabitOperationResult>;
    deleteHabit: (habitId: string) => Promise<HabitOperationResult>;
    archiveHabit: (habitId: string, archive: boolean) => Promise<HabitOperationResult>;
    updateDailyHabit: (habitId: string, day: number, value: number) => Promise<HabitOperationResult>;
    syncHabits: (forceRefresh?: boolean) => Promise<SyncResult>;
    batchArchiveHabits: (habitIds: string[], archive: boolean) => Promise<BatchOperationResult>;
    batchDeleteHabits: (habitIds: string[]) => Promise<BatchOperationResult>;
}

export interface UseHabitReturn extends UseHabitState, UseHabitActions {
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
    setHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;
    isReady: boolean;
    habitCount: number;
    activeHabits: Habit[];
    archivedHabits: Habit[];
}