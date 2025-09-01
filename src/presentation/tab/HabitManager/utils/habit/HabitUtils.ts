import type { Habit } from '../../types/habit';
import { DriveUtils } from './DriveUtils';
import { SheetsUtils } from './SheetsUtils';
import type { DriveFolder, DriveFile, BatchOperation } from '../../types/drive';

export class HabitUtils {
    private driveUtils: DriveUtils;
    private sheetsUtils: SheetsUtils;

    constructor(accessToken: string) {
        this.driveUtils = new DriveUtils(accessToken);
        this.sheetsUtils = new SheetsUtils(accessToken);
    }

    /**
     * Update access token for all utilities
     */
    updateToken(accessToken: string): void {
        this.driveUtils.updateToken(accessToken);
        this.sheetsUtils.updateToken(accessToken);
    }

    // ========== FOLDER OPERATIONS (Delegated to DriveUtils) ==========

    /**
     * Check if HabitTracker folder exists
     */
    async checkFolderExists(): Promise<DriveFolder | null> {
        return this.driveUtils.checkFolderExists();
    }

    /**
     * Create HabitTracker folder
     */
    async createFolder(): Promise<DriveFolder> {
        return this.driveUtils.createFolder();
    }

    /**
     * Get or create HabitTracker folder
     */
    async ensureFolderExists(): Promise<DriveFolder> {
        return this.driveUtils.ensureFolderExists();
    }

    /**
     * Delete HabitTracker folder and all contents
     */
    async deleteFolder(): Promise<void> {
        return this.driveUtils.deleteFolder();
    }

    // ========== SHEET FILE OPERATIONS (Delegated to DriveUtils) ==========

    /**
     * Check if habit sheet exists in folder
     */
    async checkSheetExists(folderId: string): Promise<DriveFile | null> {
        return this.driveUtils.checkSheetExists(folderId);
    }

    /**
     * Create new habit tracking spreadsheet
     */
    async createSheet(folderId: string): Promise<DriveFile> {
        const sheetFile = await this.driveUtils.createSheet(folderId);

        // Initialize with headers after creation
        await this.sheetsUtils.initializeSheetHeaders(sheetFile.id);

        return sheetFile;
    }

    /**
     * Get or create habit tracking sheet
     */
    async ensureSheetExists(): Promise<DriveFile> {
        return this.driveUtils.ensureSheetExists();
    }

    /**
     * Delete habit tracking sheet
     */
    async deleteSheet(sheetId: string): Promise<void> {
        return this.driveUtils.deleteSheet(sheetId);
    }

    // ========== SHEET CONTENT OPERATIONS (Delegated to SheetsUtils) ==========

    /**
     * Initialize sheet with headers
     */
    async initializeSheetHeaders(sheetId: string): Promise<void> {
        return this.sheetsUtils.initializeSheetHeaders(sheetId);
    }

    /**
     * Read all habits from sheet
     */
    async readAllHabits(sheetId: string): Promise<Habit[]> {
        return this.sheetsUtils.readAllHabits(sheetId);
    }

    /**
     * Write habit to sheet (create or update)
     */
    async writeHabit(sheetId: string, habit: Habit, rowIndex?: number): Promise<void> {
        return this.sheetsUtils.writeHabit(sheetId, habit, rowIndex);
    }

    /**
     * Delete habit from sheet
     */
    async deleteHabit(sheetId: string, habitId: string): Promise<void> {
        return this.sheetsUtils.deleteHabit(sheetId, habitId);
    }

    /**
     * Update specific cell value (for daily tracking)
     */
    async updateCellValue(
        sheetId: string,
        habitId: string,
        columnName: string,
        value: any
    ): Promise<void> {
        return this.sheetsUtils.updateCellValue(sheetId, habitId, columnName, value);
    }

    /**
     * Update daily habit value and recalculate streaks
     */
    async updateDailyHabit(sheetId: string, habitId: string, day: number, value: number): Promise<Habit | null> {
        return this.sheetsUtils.updateDailyHabit(sheetId, habitId, day, value);
    }

    /**
     * Batch update multiple habits
     */
    async batchUpdateHabits(sheetId: string, operations: BatchOperation[]): Promise<void> {
        return this.sheetsUtils.batchUpdateHabits(sheetId, operations);
    }
}