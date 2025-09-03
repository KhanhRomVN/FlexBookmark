/**
 * 📁 GOOGLE DRIVE & SHEETS TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN:
 * ├── 📂 Google Drive types
 * ├── 📊 Google Sheets types
 * ├── 🔄 Sync operation types
 * ├── 🎯 API response types
 * └── 🛠️ Utility types
 */

import { CommonOperationResult } from './common.types';

// ========== GOOGLE DRIVE TYPES ==========

/**
 * 📂 Google Drive file
 */
export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    parents: string[];
    size?: number;
    webViewLink?: string;
    webContentLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
}

/**
 * 📂 Google Drive folder
 */
export interface DriveFolder {
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    parents: string[];
    childCount?: number;
}

/**
 * 📊 File permissions
 */
export interface FilePermission {
    id: string;
    type: 'user' | 'group' | 'domain' | 'anyone';
    role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
    emailAddress?: string;
    domain?: string;
    displayName?: string;
}

// ========== GOOGLE SHEETS TYPES ==========

/**
 * 📊 Sheet properties
 */
export interface SheetProperties {
    sheetId: number;
    title: string;
    index: number;
    sheetType: 'GRID' | 'OBJECT' | 'DATA';
    gridProperties?: {
        rowCount: number;
        columnCount: number;
        frozenRowCount?: number;
        frozenColumnCount?: number;
    };
    tabColor?: {
        red: number;
        green: number;
        blue: number;
        alpha?: number;
    };
}

/**
 * 📊 Spreadsheet properties
 */
export interface SpreadsheetProperties {
    title: string;
    locale: string;
    autoRecalc?: 'ON_CHANGE' | 'MINUTE' | 'HOUR';
    timeZone?: string;
    defaultFormat?: {
        backgroundColor?: {
            red: number;
            green: number;
            blue: number;
            alpha?: number;
        };
        textFormat?: {
            foregroundColor?: {
                red: number;
                green: number;
                blue: number;
                alpha?: number;
            };
            fontFamily?: string;
            fontSize?: number;
            bold?: boolean;
            italic?: boolean;
            strikethrough?: boolean;
            underline?: boolean;
        };
    };
}

/**
 * 📊 Cell format
 */
export interface CellFormat {
    backgroundColor?: {
        red: number;
        green: number;
        blue: number;
        alpha?: number;
    };
    textFormat?: {
        foregroundColor?: {
            red: number;
            green: number;
            blue: number;
            alpha?: number;
        };
        fontFamily?: string;
        fontSize?: number;
        bold?: boolean;
        italic?: boolean;
        strikethrough?: boolean;
        underline?: boolean;
    };
    horizontalAlignment?: 'LEFT' | 'CENTER' | 'RIGHT';
    verticalAlignment?: 'TOP' | 'MIDDLE' | 'BOTTOM';
    wrapStrategy?: 'OVERFLOW_CELL' | 'LEGACY_WRAP' | 'CLIP' | 'WRAP';
    numberFormat?: {
        type: 'TEXT' | 'NUMBER' | 'PERCENT' | 'CURRENCY' | 'DATE' | 'TIME' | 'DATE_TIME' | 'SCIENTIFIC';
        pattern?: string;
    };
}

/**
 * 📊 Cell data
 */
export interface CellData {
    userEnteredValue?: {
        stringValue?: string;
        numberValue?: number;
        boolValue?: boolean;
        formulaValue?: string;
    };
    userEnteredFormat?: CellFormat;
    effectiveValue?: {
        stringValue?: string;
        numberValue?: number;
        boolValue?: boolean;
    };
    effectiveFormat?: CellFormat;
    formattedValue?: string;
    note?: string;
    hyperlink?: string;
}

/**
 * 📊 Row data
 */
export interface RowData {
    values: CellData[];
}

/**
 * 📊 Grid data
 */
export interface GridData {
    startRow?: number;
    startColumn?: number;
    rowData: RowData[];
}

// ========== OPERATION TYPES ==========

/**
 * 🏗️ Drive setup result
 */
export interface DriveSetupResult extends CommonOperationResult {
    folderId?: string;
    sheetId?: string;
    needsInitialSetup?: boolean;
    existingFiles?: DriveFile[];
}

/**
 * 🔄 Sync operation
 */
export interface DriveSyncOperation {
    type: 'create' | 'update' | 'delete';
    habitId: string;
    data?: any;
    timestamp: number;
}

/**
 * 🔄 Sync result
 */
export interface DriveSyncResult extends CommonOperationResult {
    habitsCount: number;
    lastSync: number;
    changes: {
        added: number;
        updated: number;
        deleted: number;
    };
    conflicts?: Array<{
        habitId: string;
        localVersion: number;
        remoteVersion: number;
        resolution: 'local' | 'remote' | 'manual';
    }>;
}

/**
 * 📊 Batch operation
 */
export interface DriveBatchOperation {
    operation: 'create' | 'update' | 'delete';
    habitId: string;
    data?: any;
}

/**
 * 📊 Batch operation result
 */
export interface DriveBatchOperationResult extends CommonOperationResult {
    successful: number;
    failed: number;
    errors: Array<{
        habitId: string;
        error: string;
        operation: string;
    }>;
}

// ========== API RESPONSE TYPES ==========

/**
 * 📡 Drive API response
 */
export interface DriveApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
        errors?: Array<{
            message: string;
            domain: string;
            reason: string;
            location?: string;
            locationType?: string;
        }>;
    };
    nextPageToken?: string;
}

/**
 * 📡 Sheets API response
 */
export interface SheetsApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
        status: string;
    };
    spreadsheetId?: string;
    updatedRange?: string;
    updatedRows?: number;
    updatedColumns?: number;
    updatedCells?: number;
}

// ========== CONFIGURATION TYPES ==========

/**
 * ⚙️ Drive configuration
 */
export interface DriveConfig {
    folderName: string;
    sheetName: string;
    backupEnabled: boolean;
    backupInterval: number; // minutes
    autoSync: boolean;
    syncInterval: number; // minutes
    conflictResolution: 'local' | 'remote' | 'prompt';
    maxRetries: number;
    timeout: number; // milliseconds
}

/**
 * ⚙️ Sheets configuration
 */
export interface SheetsConfig {
    headers: string[];
    defaultRowCount: number;
    defaultColumnCount: number;
    freezeHeaderRow: boolean;
    autoResizeColumns: boolean;
    protection: {
        protectedRanges: Array<{
            range: {
                sheetId: number;
                startRowIndex: number;
                endRowIndex: number;
                startColumnIndex: number;
                endColumnIndex: number;
            };
            description: string;
            warningOnly?: boolean;
        }>;
    };
}

// ========== ERROR TYPES ==========

/**
 * 🐛 Drive error codes
 */
export enum DriveErrorCode {
    // Generic errors
    NETWORK_ERROR = 'drive/network-error',
    TIMEOUT = 'drive/timeout',
    QUOTA_EXCEEDED = 'drive/quota-exceeded',

    // File errors
    FILE_NOT_FOUND = 'drive/file-not-found',
    FILE_EXISTS = 'drive/file-exists',
    PERMISSION_DENIED = 'drive/permission-denied',
    RATE_LIMIT_EXCEEDED = 'drive/rate-limit-exceeded',

    // Sheet errors
    INVALID_RANGE = 'drive/invalid-range',
    BAD_REQUEST = 'drive/bad-request',
    PARSE_ERROR = 'drive/parse-error',

    // Sync errors
    SYNC_CONFLICT = 'drive/sync-conflict',
    SYNC_FAILED = 'drive/sync-failed',
    OFFLINE = 'drive/offline',
}

/**
 * 🐛 Drive error
 */
export interface DriveError {
    code: DriveErrorCode;
    message: string;
    details?: any;
    retryable: boolean;
    timestamp: number;
}

// ========== SYNC TYPES ==========

/**
 * 🔄 Sync status
 */
export interface DriveSyncStatus {
    inProgress: boolean;
    lastSync: number;
    lastSuccess: number;
    pendingOperations: number;
    conflicts: number;
    error?: DriveError;
}

/**
 * 🔄 Offline operation
 */
export interface OfflineOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    habitId: string;
    data?: any;
    timestamp: number;
    retryCount: number;
    lastError?: DriveError;
}

/**
 * 🔄 Conflict resolution
 */
export interface ConflictResolution {
    habitId: string;
    resolution: 'local' | 'remote' | 'manual';
    timestamp: number;
    resolvedBy: string;
}

// ========== TYPE GUARDS ==========

/**
 * ✅ Check if value is DriveFile
 */
export const isDriveFile = (value: any): value is DriveFile => {
    return value &&
        typeof value === 'object' &&
        'id' in value &&
        'name' in value &&
        'mimeType' in value;
};

/**
 * ✅ Check if value is DriveFolder
 */
export const isDriveFolder = (value: any): value is DriveFolder => {
    return isDriveFile(value) &&
        value.mimeType === 'application/vnd.google-apps.folder';
};

/**
 * ✅ Check if value is DriveError
 */
export const isDriveError = (value: any): value is DriveError => {
    return value &&
        typeof value === 'object' &&
        'code' in value &&
        'message' in value &&
        'retryable' in value;
};

/**
 * ✅ Check if value is DriveSyncResult
 */
export const isDriveSyncResult = (value: any): value is DriveSyncResult => {
    return value &&
        typeof value === 'object' &&
        'habitsCount' in value &&
        'lastSync' in value &&
        'changes' in value;
};

// ========== CONSTANTS ==========

/**
 * 🎯 Default constants
 */
export const HabitConstants = {
    FOLDER_NAME: 'HabitTracker',
    SHEET_NAME: 'Daily Habits Tracker',
    SHEET_HEADERS: [
        'ID', 'Name', 'Description', 'Type', 'Difficulty', 'Goal', 'Limit', 'Current Streak',
        // Days 1-31 for daily tracking
        ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
        // Additional properties
        'Created Date', 'Color Code', 'Longest Streak', 'Category', 'Tags',
        'Is Archived', 'Is Quantifiable', 'Unit', 'Start Time', 'Subtasks'
    ],

    // API endpoints
    SHEETS_API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',
    DRIVE_API_BASE: 'https://www.googleapis.com/drive/v3',

    // Default configuration
    DEFAULT_CONFIG: {
        folderName: 'HabitTracker',
        sheetName: 'Daily Habits Tracker',
        backupEnabled: true,
        backupInterval: 1440, // 24 hours
        autoSync: true,
        syncInterval: 5, // 5 minutes
        conflictResolution: 'prompt' as const,
        maxRetries: 3,
        timeout: 30000 // 30 seconds
    }
} as const;
