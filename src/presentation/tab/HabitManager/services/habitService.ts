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
            console.log('Fetching habits from server...');
            const rows = await this.sheetService.fetchRowsFromSheet();
            console.log('Raw rows from sheet:', rows);

            const habits = rows.map(row => this.rowToHabit(row));
            console.log('Converted habits:', habits);
            return habits;
        } catch (error) {
            console.error('Error fetching habits from server:', error);
            throw error;
        }
    }

    private rowToHabit(row: any[]): Habit {
        // Kiểm tra row có tồn tại và là mảng không
        if (!row || !Array.isArray(row)) {
            console.warn('Invalid row data:', row);
            return this.createDefaultHabit();
        }

        const today = new Date().getDate();
        const safeRow = row;

        // Kiểm tra độ dài mảng trước khi truy cập
        const completedTodayIndex = 7 + today;
        const hasCompletedToday = safeRow.length > completedTodayIndex;

        // Xử lý tags - cột 44 là isArchived, nên tags có thể ở cột 43
        let tags: string[] = [];
        if (safeRow.length > 43 && safeRow[43]) {
            try {
                tags = safeRow[43].split(',').map((tag: string) => tag.trim()).filter(Boolean);
            } catch (error) {
                console.warn('Error parsing tags:', error);
                tags = [];
            }
        }

        return {
            id: safeRow.length > 0 ? safeRow[0] || '' : '',
            name: safeRow.length > 1 ? safeRow[1] || '' : '',
            description: safeRow.length > 2 ? safeRow[2] || '' : '',
            habitType: safeRow.length > 3 ? (safeRow[3] as 'good' | 'bad' || 'good') : 'good',
            difficultyLevel: safeRow.length > 4 ? parseInt(safeRow[4]) || 3 : 3,
            goal: safeRow.length > 5 && safeRow[5] ? parseInt(safeRow[5]) : undefined,
            limit: safeRow.length > 6 && safeRow[6] ? parseInt(safeRow[6]) : undefined,
            currentStreak: safeRow.length > 7 ? parseInt(safeRow[7]) || 0 : 0,
            completedToday: hasCompletedToday ? safeRow[completedTodayIndex] === 'TRUE' : false,
            colorCode: safeRow.length > 40 ? safeRow[40] || '#3b82f6' : '#3b82f6',
            category: safeRow.length > 42 ? safeRow[42] || 'other' : 'other', // Điều chỉnh index
            tags: tags, // Thêm tags
            isArchived: safeRow.length > 44 ? safeRow[44] === 'TRUE' : false,
            createdAt: new Date(safeRow.length > 39 ? safeRow[39] || Date.now() : Date.now()),
            updatedAt: new Date(),
            longestStreak: safeRow.length > 41 ? parseInt(safeRow[41]) || 0 : 0,
            startTime: safeRow.length > 47 ? safeRow[47] : undefined,
            unit: safeRow.length > 46 ? safeRow[46] : undefined
        };
    }

    private createDefaultHabit(): Habit {
        return {
            id: '',
            name: '',
            description: '',
            habitType: 'good',
            difficultyLevel: 3,
            colorCode: '#3b82f6',
            category: 'other',
            tags: [],
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            currentStreak: 0,
            longestStreak: 0,
            completedToday: false
        };
    }

    private habitToRow(habit: Habit): any[] {
        const row = new Array(49).fill('');

        // Đảm bảo habit có giá trị hợp lệ
        if (!habit) return row;

        row[0] = habit.id || '';
        row[1] = habit.name || '';
        row[2] = habit.description || '';
        row[3] = habit.habitType || 'good';
        row[4] = (habit.difficultyLevel || 3).toString();
        row[5] = habit.goal?.toString() || '';
        row[6] = habit.limit?.toString() || '';
        row[7] = (habit.currentStreak || 0).toString();
        row[39] = habit.createdAt ? habit.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        row[40] = habit.colorCode || '#3b82f6';
        row[41] = (habit.longestStreak || 0).toString();
        row[42] = habit.category || 'other';
        row[43] = habit.tags?.join(',') || ''; // Xử lý tags
        row[44] = habit.isArchived ? 'TRUE' : 'FALSE';
        row[46] = habit.unit || '';
        row[47] = habit.startTime || '';

        // Mark today as completed if needed
        if (habit.completedToday) {
            const today = new Date().getDate();
            if (7 + today < row.length) {
                row[7 + today] = 'TRUE';
            }
        }

        return row;
    }

    async createHabitOnServer(habit: Habit) {
        try {
            if (!habit) {
                throw new Error('Invalid habit data');
            }

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