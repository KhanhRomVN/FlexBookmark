import type { Habit, HabitType, HabitCategory } from "../../types/habit";
import { DriveApiClient } from './DriveApiClient';
import { SheetManager } from './SheetManager';

export interface DriveFolder {
    id: string;
    name: string;
    parents?: string[];
}

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
}

export class DriveFileManager {
    private apiClient: DriveApiClient;
    private sheetManager: SheetManager;
    private flexBookmarkFolderId: string | null = null;

    constructor(accessToken: string) {
        this.apiClient = new DriveApiClient(accessToken);
        this.sheetManager = new SheetManager(this.apiClient);
    }

    updateToken(newToken: string): void {
        this.apiClient.updateToken(newToken);
    }

    async autoInitialize(): Promise<string> {
        console.log('🚀 Starting comprehensive auto-initialization...');

        try {
            // Step 1: Create folder structure
            const { habitManagerFolderId } = await this.ensureFolderStructure();
            console.log('✅ Folder structure ensured');

            // Step 2: Create monthly sheet
            const sheetId = await this.ensureMonthlySheet(habitManagerFolderId);
            console.log('✅ Monthly sheet ensured');

            // Step 3: Test accessibility
            await this.testSheetAccess(sheetId);
            console.log('✅ Sheet access verified');

            return sheetId;

        } catch (error) {
            console.error('❌ Auto-initialization failed:', error);
            // Add more detailed error information
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Stack trace:', error.stack);
            }
            throw new Error(`Auto-initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getHabitWithTracking(sheetId: string, habitId: string): Promise<Habit | null> {
        try {
            const habits = await this.readHabits(sheetId);
            return habits.find(habit => habit.id === habitId) || null;
        } catch (error) {
            console.error('Error getting habit with tracking:', error);
            return null;
        }
    }

    private async ensureFolderStructure(): Promise<{ habitManagerFolderId: string }> {
        // Find or create FlexBookmark folder
        let flexBookmarkFolder = await this.apiClient.findFolder('FlexBookmark', 'root');
        if (!flexBookmarkFolder) {
            flexBookmarkFolder = await this.apiClient.createFolder('FlexBookmark', 'root');
        }
        this.flexBookmarkFolderId = flexBookmarkFolder.id;

        // Find or create HabitManager subfolder
        let habitManagerFolder = await this.apiClient.findFolder('HabitManager', flexBookmarkFolder.id);
        if (!habitManagerFolder) {
            habitManagerFolder = await this.apiClient.createFolder('HabitManager', flexBookmarkFolder.id);
        }

        // Find or create current year folder
        const currentYear = new Date().getFullYear().toString();
        let yearFolder = await this.apiClient.findFolder(currentYear, habitManagerFolder.id);
        if (!yearFolder) {
            yearFolder = await this.apiClient.createFolder(currentYear, habitManagerFolder.id);
        }

        return { habitManagerFolderId: yearFolder.id };
    }

    private async ensureMonthlySheet(parentFolderId: string): Promise<string> {
        const currentDate = new Date();
        const monthYear = `flex_bookmark_${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;

        let habitSheet = await this.apiClient.findFile(monthYear, parentFolderId);

        if (!habitSheet) {
            const sheetId = await this.apiClient.createSpreadsheet(monthYear, parentFolderId);
            await this.sheetManager.initializeSheetStructure(sheetId);
            return sheetId;
        } else {
            return habitSheet.id;
        }
    }

    private async testSheetAccess(sheetId: string): Promise<void> {
        try {
            await this.apiClient.readSheetRange(sheetId, 'HabitTracker!A1:A1');
            console.log('✅ Sheet access verified');
        } catch (error) {
            console.error('❌ Sheet access test failed:', error);
            throw error;
        }
    }

    // CRUD Operations
    async readHabits(sheetId: string): Promise<Habit[]> {
        try {
            const values = await this.apiClient.readSheetRange(sheetId, 'HabitTracker!A2:AW1000');

            return values
                .map(row => this.sheetManager.rowToHabit(row))
                .filter((habit): habit is Habit => habit !== null);
        } catch (error) {
            console.error('Error reading habits:', error);
            return [];
        }
    }

    async createHabit(sheetId: string, habit: Habit): Promise<void> {
        const row = this.sheetManager.habitToRow(habit);
        await this.appendRow(sheetId, row);
    }

    async updateHabit(sheetId: string, habit: Habit): Promise<void> {
        const rowIndex = await this.findHabitRowIndex(sheetId, habit.id);
        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const row = this.sheetManager.habitToRow(habit);
        const actualRowIndex = rowIndex + 2; // +2 because we start from A2

        await this.apiClient.updateSheetRange(
            sheetId,
            `HabitTracker!A${actualRowIndex}:AW${actualRowIndex}`,
            [row]
        );
    }

    async deleteHabit(sheetId: string, habitId: string): Promise<void> {
        const rowIndex = await this.findHabitRowIndex(sheetId, habitId);
        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;
        const emptyRow = Array(50).fill('');

        await this.apiClient.updateSheetRange(
            sheetId,
            `HabitTracker!A${actualRowIndex}:AW${actualRowIndex}`,
            [emptyRow]
        );
    }

    async updateDailyHabit(sheetId: string, habitId: string, day: number, value: number): Promise<void> {
        if (day < 1 || day > 31) {
            throw new Error('Day must be between 1 and 31');
        }

        const rowIndex = await this.findHabitRowIndex(sheetId, habitId);
        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;
        const columnIndex = 8 + day - 1; // Column I = index 8
        const columnLetter = this.getColumnLetter(columnIndex + 1);

        await this.apiClient.updateSheetRange(
            sheetId,
            `HabitTracker!${columnLetter}${actualRowIndex}`,
            [[value.toString()]]
        );

        // Update streaks
        await this.updateHabitStreaks(sheetId, habitId);
    }

    async archiveHabit(sheetId: string, habitId: string, archive: boolean): Promise<void> {
        const rowIndex = await this.findHabitRowIndex(sheetId, habitId);
        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;
        await this.apiClient.updateSheetRange(
            sheetId,
            `HabitTracker!AS${actualRowIndex}`,
            [[archive.toString().toUpperCase()]]
        );
    }

    // Helper methods
    private async findHabitRowIndex(sheetId: string, habitId: string): Promise<number> {
        const values = await this.apiClient.readSheetRange(sheetId, 'HabitTracker!A2:A1000');
        return values.findIndex(row => row[0] === habitId);
    }

    private async appendRow(sheetId: string, row: string[]): Promise<void> {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/HabitTracker!A:AW:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiClient['accessToken']}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values: [row] }),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to append row: ${response.status}`);
        }
    }

    private getColumnLetter(columnNumber: number): string {
        let result = '';
        while (columnNumber > 0) {
            columnNumber--;
            result = String.fromCharCode(65 + (columnNumber % 26)) + result;
            columnNumber = Math.floor(columnNumber / 26);
        }
        return result;
    }

    private async updateHabitStreaks(sheetId: string, habitId: string): Promise<void> {
        const habits = await this.readHabits(sheetId);
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const { currentStreak, longestStreak } = this.calculateStreaks(habit);
        const rowIndex = await this.findHabitRowIndex(sheetId, habitId);

        if (rowIndex !== -1) {
            const actualRowIndex = rowIndex + 2;

            // Update both streaks
            await Promise.all([
                this.apiClient.updateSheetRange(sheetId, `HabitTracker!H${actualRowIndex}`, [[currentStreak.toString()]]),
                this.apiClient.updateSheetRange(sheetId, `HabitTracker!AP${actualRowIndex}`, [[longestStreak.toString()]])
            ]);
        }
    }

    private calculateStreaks(habit: Habit): { currentStreak: number; longestStreak: number } {
        const currentDate = new Date();
        const currentDay = currentDate.getDate();

        let currentStreak = 0;
        let longestStreak = habit.longestStreak;
        let tempStreak = 0;

        for (let day = 1; day <= currentDay; day++) {
            const dayIndex = day - 1;
            const value = habit.dailyTracking[dayIndex];

            let isCompleted = false;
            if (value !== null) {
                if (habit.habitType === 'good') {
                    isCompleted = habit.goal ? value >= habit.goal : value > 0;
                } else {
                    isCompleted = habit.limit ? value <= habit.limit : value === 0;
                }
            }

            if (isCompleted) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        currentStreak = tempStreak;
        return { currentStreak, longestStreak };
    }

    async testDriveAccess(): Promise<boolean> {
        try {
            const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1', {
                headers: { 'Authorization': `Bearer ${this.apiClient['accessToken']}` }
            });
            return response.ok;
        } catch (error) {
            console.error('Drive access test failed:', error);
            return false;
        }
    }

    // Utility methods for filtering
    async getHabitsByCategory(sheetId: string, category: HabitCategory): Promise<Habit[]> {
        const habits = await this.readHabits(sheetId);
        return habits.filter(habit => habit.category === category);
    }

    async getHabitsByType(sheetId: string, habitType: HabitType): Promise<Habit[]> {
        const habits = await this.readHabits(sheetId);
        return habits.filter(habit => habit.habitType === habitType);
    }

    async getActiveHabits(sheetId: string): Promise<Habit[]> {
        const habits = await this.readHabits(sheetId);
        return habits.filter(habit => !habit.isArchived);
    }
}