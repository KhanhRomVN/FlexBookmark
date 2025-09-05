import { Habit } from '../types/types';
import { SheetService } from './sheetService';

export class HabitServer {
    private sheetService: SheetService;

    constructor(accessToken: string) {
        this.sheetService = new SheetService(accessToken);
    }

    async setupDrive(): Promise<string> {
        return await this.sheetService.setupDrive();
    }

    async fetchHabitsFromServer(): Promise<Habit[]> {
        try {
            const rows = await this.sheetService.fetchRowsFromSheet();
            return rows.map(row => this.rowToHabit(row));
        } catch (error) {
            console.error('Error fetching habits from server:', error);
            throw error;
        }
    }

    private rowToHabit(row: any[]): Habit {
        const today = new Date().getDate();

        return {
            id: row[0] || '',
            name: row[1] || '',
            description: row[2] || '',
            habitType: row[3] as 'good' | 'bad',
            difficultyLevel: parseInt(row[4]) || 3,
            goal: row[5] ? parseInt(row[5]) : undefined,
            limit: row[6] ? parseInt(row[6]) : undefined,
            currentStreak: parseInt(row[7]) || 0,
            completedToday: row[7 + today] === 'TRUE',
            colorCode: row[40] || '#3b82f6',
            category: row[43] || 'other',
            isArchived: row[44] === 'TRUE',
            createdAt: new Date(row[39] || Date.now()),
            updatedAt: new Date(),
            longestStreak: parseInt(row[41]) || 0,
            startTime: row[47] || undefined,
            unit: row[46] || undefined
        };
    }

    private habitToRow(habit: Habit): any[] {
        const row = new Array(49).fill('');

        row[0] = habit.id;
        row[1] = habit.name;
        row[2] = habit.description;
        row[3] = habit.habitType;
        row[4] = habit.difficultyLevel.toString();
        row[5] = habit.goal?.toString() || '';
        row[6] = habit.limit?.toString() || '';
        row[7] = habit.currentStreak.toString();
        row[39] = habit.createdAt.toISOString().split('T')[0];
        row[40] = habit.colorCode;
        row[41] = habit.longestStreak.toString();
        row[43] = habit.category;
        row[44] = habit.isArchived ? 'TRUE' : 'FALSE';
        row[46] = habit.unit || '';
        row[47] = habit.startTime || '';

        // Mark today as completed if needed
        if (habit.completedToday) {
            const today = new Date().getDate();
            row[7 + today] = 'TRUE';
        }

        return row;
    }

    async createHabitOnServer(habit: Habit) {
        try {
            const row = this.habitToRow(habit);
            await this.sheetService.appendRow(row);
        } catch (error) {
            console.error('Error creating habit:', error);
            throw error;
        }
    }

    async updateHabitOnServer(habit: Habit) {
        try {
            // First, find the row index of the habit
            const rowIndex = await this.sheetService.findRowIndex('A', habit.id);
            if (rowIndex === -1) {
                throw new Error('Habit not found');
            }

            // Update the row
            const row = this.habitToRow(habit);
            await this.sheetService.updateRow(rowIndex, row);
        } catch (error) {
            console.error('Error updating habit:', error);
            throw error;
        }
    }

    async deleteHabitOnServer(habitId: string) {
        try {
            // First, find the row index of the habit
            const rowIndex = await this.sheetService.findRowIndex('A', habitId);
            if (rowIndex === -1) {
                throw new Error('Habit not found');
            }

            // Delete the row
            await this.sheetService.deleteRow(rowIndex);
        } catch (error) {
            console.error('Error deleting habit:', error);
            throw error;
        }
    }
}