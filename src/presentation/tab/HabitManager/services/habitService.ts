import type {
    Habit,
    GoodHabit,
    BadHabit,
    HabitCategory,
    DriveSetupResult,
    DriveSyncResult
} from '../types';

// Import values (not types) for enums
import { HabitType } from '../types';

export class HabitService {
    private accessToken: string;
    private currentSheetId: string | null = null;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    /**
     * 🏗️ Set up Google Drive structure for habit tracking
     * @returns {Promise<DriveSetupResult>} Setup result
     */
    async setupDriveStructure(): Promise<DriveSetupResult> {
        try {
            console.log('📁 Setting up drive structure...');

            // Check if folder exists
            const folderExists = await this.checkFolderExists();
            let folderId: string;

            if (!folderExists) {
                folderId = await this.createFolder();
            } else {
                folderId = folderExists.id;
            }

            // Check if sheet exists
            const sheetExists = await this.checkSheetExists(folderId);

            if (!sheetExists) {
                const sheetFile = await this.createSheet(folderId);
                this.currentSheetId = sheetFile.id;

                return {
                    success: true,
                    folderId,
                    sheetId: sheetFile.id,
                    needsInitialSetup: true,
                    existingFiles: [],
                    timestamp: Date.now()
                };
            } else {
                this.currentSheetId = sheetExists.id;

                return {
                    success: true,
                    folderId,
                    sheetId: sheetExists.id,
                    needsInitialSetup: false,
                    existingFiles: [sheetExists],
                    timestamp: Date.now()
                };
            }
        } catch (error) {
            console.error('❌ Drive setup failed:', error);
            return {
                success: false,
                folderId: undefined,
                sheetId: undefined,
                needsInitialSetup: false,
                existingFiles: [],
                error: error instanceof Error ? error.message : 'Drive setup failed',
                timestamp: Date.now()
            };
        }
    }

    /**
     * 🔍 Check if habit folder exists
     * @private
     */
    private async checkFolderExists(): Promise<any> {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='HabitTracker' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Folder check failed: ${response.status}`);
        }

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    }

    /**
     * 📂 Create habit folder
     * @private
     */
    private async createFolder(): Promise<string> {
        const folderMetadata = {
            name: 'HabitTracker',
            mimeType: 'application/vnd.google-apps.folder'
        };

        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(folderMetadata)
        });

        if (!response.ok) {
            throw new Error(`Folder creation failed: ${response.status}`);
        }

        const folder = await response.json();
        return folder.id;
    }

    /**
     * 🔍 Check if habit sheet exists
     * @private
     */
    private async checkSheetExists(folderId: string): Promise<any> {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='Daily Habits Tracker' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Sheet check failed: ${response.status}`);
        }

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    }

    /**
     * 📊 Create habit sheet
     * @private
     */
    private async createSheet(folderId: string): Promise<any> {
        const spreadsheetData = {
            properties: {
                title: 'Daily Habits Tracker'
            },
            sheets: [{
                properties: {
                    title: 'Habits',
                    gridProperties: {
                        rowCount: 1000,
                        columnCount: 50
                    }
                }
            }]
        };

        const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(spreadsheetData)
        });

        if (!createResponse.ok) {
            throw new Error(`Sheet creation failed: ${createResponse.status}`);
        }

        const newSheet = await createResponse.json();

        // Move to folder
        await fetch(`https://www.googleapis.com/drive/v3/files/${newSheet.spreadsheetId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parents: [folderId]
            })
        });

        // Initialize headers
        await this.initializeSheetHeaders(newSheet.spreadsheetId);

        return {
            id: newSheet.spreadsheetId,
            name: 'Daily Habits Tracker'
        };
    }

    /**
     * 🏗️ Initialize sheet headers
     * @private
     */
    private async initializeSheetHeaders(sheetId: string): Promise<void> {
        const headers = [
            'ID', 'Name', 'Description', 'Type', 'Difficulty', 'Goal', 'Limit', 'Current Streak',
            ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
            'Created Date', 'Color Code', 'Longest Streak', 'Category', 'Tags',
            'Is Archived', 'Is Quantifiable', 'Unit', 'Start Time', 'Subtasks'
        ];

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Habits!A1:AW1?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [headers]
                })
            }
        );

        if (!response.ok) {
            console.warn('⚠️ Header initialization failed:', response.status);
        }
    }

    /**
     * 📖 Read all habits from sheet
     * @returns {Promise<Habit[]>} List of habits
     */
    async readAllHabits(): Promise<Habit[]> {
        if (!this.currentSheetId) {
            throw new Error('No sheet initialized');
        }

        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.currentSheetId}/values/Habits!A2:AW`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Read habits failed: ${response.status}`);
            }

            const data = await response.json();
            const rows = data.values || [];

            return rows.map((row: any[]) => this.parseHabitFromRow(row)).filter(Boolean) as Habit[];
        } catch (error) {
            console.error('❌ Failed to read habits:', error);
            throw error;
        }
    }

    /**
     * 📝 Write habit to sheet
     * @param habit Habit to write
     * @param rowIndex Optional row index for update
     */
    async writeHabit(habit: Habit, rowIndex?: number): Promise<void> {
        if (!this.currentSheetId) {
            throw new Error('No sheet initialized');
        }

        try {
            const habitRow = this.convertHabitToRow(habit);
            let range: string;

            if (rowIndex !== undefined) {
                range = `Habits!A${rowIndex + 2}:AW${rowIndex + 2}`;
            } else {
                const nextRow = await this.findNextEmptyRow();
                range = `Habits!A${nextRow}:AW${nextRow}`;
            }

            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.currentSheetId}/values/${range}?valueInputOption=RAW`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        values: [habitRow]
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Write habit failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to write habit:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Delete habit from sheet
     * @param habitId Habit ID to delete
     */
    async deleteHabit(habitId: string): Promise<void> {
        if (!this.currentSheetId) {
            throw new Error('No sheet initialized');
        }

        try {
            const habits = await this.readAllHabits();
            const habitIndex = habits.findIndex(h => h.id === habitId);

            if (habitIndex === -1) {
                throw new Error(`Habit ${habitId} not found`);
            }

            const rowNumber = habitIndex + 2;
            const range = `Habits!A${rowNumber}:AW${rowNumber}`;

            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.currentSheetId}/values/${range}:clear`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Delete habit failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to delete habit:', error);
            throw error;
        }
    }

    /**
     * 📅 Update daily habit tracking
     * @param habitId Habit ID
     * @param day Day of month (1-31)
     * @param value Tracking value
     */
    async updateDailyHabit(habitId: string, value: number): Promise<Habit> {
        if (!this.currentSheetId) {
            throw new Error('No sheet initialized');
        }

        try {
            const habits = await this.readAllHabits();
            const habit = habits.find(h => h.id === habitId);

            if (!habit) {
                throw new Error(`Habit ${habitId} not found`);
            }

            // Recalculate streaks based on the new value
            const { currentStreak, longestStreak } = this.calculateStreaks(habit, value);

            let updatedHabit: Habit;

            if (isGoodHabit(habit)) {
                updatedHabit = {
                    ...habit,
                    currentStreak,
                    longestStreak: Math.max(longestStreak, habit.longestStreak)
                };
            } else {
                updatedHabit = {
                    ...habit,
                    currentStreak,
                    longestStreak: Math.max(longestStreak, habit.longestStreak)
                };
            }

            // Write back to sheet
            const habitIndex = habits.findIndex(h => h.id === habitId);
            await this.writeHabit(updatedHabit, habitIndex);

            return updatedHabit;
        } catch (error) {
            console.error('❌ Failed to update daily habit:', error);
            throw error;
        }
    }

    /**
     * 🔄 Sync habits with remote storage
     * @param forceRefresh Force refresh from remote
     */
    async syncHabits(forceRefresh: boolean = false): Promise<DriveSyncResult> {
        try {
            console.log('🔄 Syncing habits...');

            if (!this.currentSheetId || forceRefresh) {
                await this.setupDriveStructure();
            }

            const remoteHabits = await this.readAllHabits();

            return {
                success: true,
                habitsCount: remoteHabits.length,
                lastSync: Date.now(),
                changes: { added: 0, updated: 0, deleted: 0 },
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('❌ Sync failed:', error);
            return {
                success: false,
                habitsCount: 0,
                lastSync: Date.now(),
                changes: { added: 0, updated: 0, deleted: 0 },
                error: error instanceof Error ? error.message : 'Sync failed',
                timestamp: Date.now()
            };
        }
    }

    // ========== HELPER METHODS ==========

    private async findNextEmptyRow(): Promise<number> {
        if (!this.currentSheetId) return 2;

        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.currentSheetId}/values/Habits!A:A`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) return 2;

            const data = await response.json();
            const values = data.values || [];
            return values.length + 1;
        } catch {
            return 2;
        }
    }

    private convertHabitToRow(habit: Habit): any[] {
        const row = new Array(50).fill('');

        // Core properties
        row[0] = habit.id;
        row[1] = habit.name;
        row[2] = habit.description || '';
        row[3] = habit.habitType;
        row[4] = habit.difficultyLevel;

        // Type-specific properties
        if (isGoodHabit(habit)) {
            row[5] = habit.goal || '';
            row[6] = ''; // Limit is for bad habits only
            row[45] = habit.isQuantifiable ? 'TRUE' : 'FALSE';
            row[46] = habit.unit || '';
        } else {
            row[5] = ''; // Goal is for good habits only
            row[6] = habit.limit || '';
            row[45] = 'FALSE'; // Bad habits are not quantifiable
            row[46] = ''; // No unit for bad habits
        }

        row[7] = habit.currentStreak;

        // Daily tracking - we'll leave this empty since Habit type doesn't include dailyTracking
        for (let i = 0; i < 31; i++) {
            row[8 + i] = ''; // Empty for daily tracking
        }

        // Additional properties
        row[39] = habit.createdDate.toISOString();
        row[40] = habit.colorCode;
        row[41] = habit.longestStreak;
        row[42] = habit.category;
        row[43] = JSON.stringify(habit.tags);
        row[44] = habit.isArchived ? 'TRUE' : 'FALSE';

        // Start time and subtasks are not part of the base Habit type
        row[47] = '';
        row[48] = '';

        return row;
    }

    private parseHabitFromRow(row: any[]): Habit | null {
        try {
            if (!row || row.length === 0 || !row[0]) return null;

            const habitType = row[3] as HabitType;
            const baseHabit = {
                id: row[0],
                name: row[1] || '',
                description: row[2] || '',
                habitType,
                difficultyLevel: parseInt(row[4]) || 1,
                currentStreak: parseInt(row[7]) || 0,
                createdDate: new Date(row[39] || Date.now()),
                colorCode: row[40] || '#3b82f6',
                longestStreak: parseInt(row[41]) || 0,
                category: (row[42] as HabitCategory) || 'other',
                tags: this.safeJsonParse(row[43], []),
                isArchived: row[44] === 'TRUE',
                updatedDate: new Date() // Assuming updated date is now
            };

            if (habitType === HabitType.GOOD) {
                const goodHabit: GoodHabit = {
                    ...baseHabit,
                    habitType: HabitType.GOOD,
                    goal: row[5] ? parseFloat(row[5]) : 1,
                    isQuantifiable: row[45] === 'TRUE',
                    unit: row[46] || '',
                };
                return goodHabit;
            } else {
                const badHabit: BadHabit = {
                    ...baseHabit,
                    habitType: HabitType.BAD,
                    limit: row[6] ? parseFloat(row[6]) : 1,
                };
                return badHabit;
            }
        } catch (error) {
            console.error('❌ Failed to parse habit from row:', error);
            return null;
        }
    }

    private calculateStreaks(habit: Habit, value: number): { currentStreak: number; longestStreak: number } {
        // Simplified streak calculation
        const isCompleted = this.isHabitCompletedForDay(habit, value);

        let currentStreak = habit.currentStreak;
        let longestStreak = habit.longestStreak;

        if (isCompleted) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }

        return { currentStreak, longestStreak };
    }

    private isHabitCompletedForDay(habit: Habit, value: number): boolean {
        if (isGoodHabit(habit)) {
            return habit.goal ? value >= habit.goal : value > 0;
        } else {
            return habit.limit ? value <= habit.limit : value === 0;
        }
    }

    private safeJsonParse(value: any, fallback: any): any {
        if (!value || typeof value !== 'string') return fallback;
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
}

// Type guards
export const isGoodHabit = (habit: Habit): habit is GoodHabit => {
    return habit.habitType === HabitType.GOOD;
};

export const isBadHabit = (habit: Habit): habit is BadHabit => {
    return habit.habitType === HabitType.BAD;
};

export default HabitService;