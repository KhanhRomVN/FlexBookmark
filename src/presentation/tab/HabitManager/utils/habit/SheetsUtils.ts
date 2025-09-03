/**
 * 📊 GOOGLE SHEETS UTILITIES MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 📝 Quản lý nội dung và format của Google Sheets
 * ├── 🔄 Xử lý CRUD operations với dữ liệu thói quen
 * ├── 📈 Tính toán streaks và business logic
 * ├── 🎨 Formatting và styling sheets
 * └── 🔧 Xử lý transformation giữa objects và sheet rows
 * 
 * 🏗️ CẤU TRÚC CHÍNH:
 * ├── Sheet Initialization → Khởi tạo headers và formatting
 * ├── Content Operations   → Đọc/ghi dữ liệu thói quen
 * ├── Business Logic      → Tính streaks, validation
 * ├── Formatting          → Styling và formatting sheets
 * └── Helper Methods      → Utilities chuyển đổi dữ liệu
 * 
 * 🔧 CÁC CHỨC NĂNG CHÍNH:
 * ├── initializeSheetHeaders() → Khởi tạo headers
 * ├── readAllHabits()         → Đọc tất cả thói quen
 * ├── writeHabit()           → Ghi thói quen (create/update)
 * ├── deleteHabit()          → Xóa thói quen
 * ├── updateDailyHabit()     → Cập nhật tracking hàng ngày
 * ├── calculateStreaks()     → Tính toán streaks
 * └── convertHabitToRow()    → Chuyển habit object thành sheet row
 */

import type { Habit } from '../../types/habit';
import { HabitConstants, type BatchOperation } from '../../types/drive';

export class SheetsUtils {
    // 🔐 PRIVATE PROPERTIES
    // ────────────────────────────────────────────────────────────────────────────
    private accessToken: string;

    // 🏗️ CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🏗️ Khởi tạo SheetsUtils với access token
     * @param accessToken - Google OAuth2 access token
     */
    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    // 🔄 TOKEN MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔄 Cập nhật access token mới
     * @param accessToken - Token mới
     */
    updateToken(accessToken: string): void {
        this.accessToken = accessToken;
    }

    // ========== SHEET INITIALIZATION ==========

    /**
     * 🏗️ Khởi tạo sheet với headers
     * @param sheetId - ID sheet cần khởi tạo
     * @returns {Promise<void>}
     */
    async initializeSheetHeaders(sheetId: string): Promise<void> {
        try {
            console.log('🏗️ Initializing sheet headers...');
            const range = 'Habits!A1:AW1'; // Headers across all columns

            const response = await fetch(
                `${HabitConstants.SHEETS_API_BASE}/${sheetId}/values/${range}?valueInputOption=RAW`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        values: [HabitConstants.SHEET_HEADERS]
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to initialize headers: ${response.status}`);
            }

            // 🎨 Format header row
            await this.formatHeaderRow(sheetId);
            console.log('✅ Sheet headers initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize sheet headers:', error);
            throw error;
        }
    }

    /**
     * 🎨 Format header row với styling
     * @private
     * @param sheetId - ID sheet cần format
     * @returns {Promise<void>}
     */
    private async formatHeaderRow(sheetId: string): Promise<void> {
        try {
            const requests = [{
                repeatCell: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: HabitConstants.SHEET_HEADERS.length
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                            textFormat: {
                                foregroundColor: { red: 1, green: 1, blue: 1 },
                                bold: true
                            }
                        }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)'
                }
            }];

            const response = await fetch(
                `${HabitConstants.SHEETS_API_BASE}/${sheetId}:batchUpdate`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ requests })
                }
            );

            if (!response.ok) {
                console.warn('⚠️ Failed to format header row:', response.status);
            } else {
                console.log('✅ Header row formatted successfully');
            }

        } catch (error) {
            console.warn('⚠️ Failed to format header row:', error);
        }
    }

    // ========== SHEET CONTENT OPERATIONS ==========

    /**
     * 📖 Đọc tất cả thói quen từ sheet
     * @param sheetId - ID sheet cần đọc
     * @returns {Promise<Habit[]>} Danh sách thói quen
     */
    async readAllHabits(sheetId: string): Promise<Habit[]> {
        try {
            console.log(`📖 Reading all habits from sheet: ${sheetId}`);
            const range = 'Habits!A2:AW'; // Skip header row

            const response = await fetch(
                `${HabitConstants.SHEETS_API_BASE}/${sheetId}/values/${range}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to read habits: ${response.status}`);
            }

            const data = await response.json();
            const rows = data.values || [];
            const habits = rows.map((row: any[]) => this.parseHabitFromRow(row)).filter(Boolean) as Habit[];

            console.log(`📊 Read ${habits.length} habits from sheet`);
            return habits;

        } catch (error) {
            console.error('❌ Failed to read habits from sheet:', error);
            throw error;
        }
    }

    /**
     * 📝 Ghi thói quen vào sheet (create hoặc update)
     * @param sheetId - ID sheet đích
     * @param habit - Thói quen cần ghi
     * @param rowIndex - Index hàng (optional cho update)
     * @returns {Promise<void>}
     */
    async writeHabit(sheetId: string, habit: Habit, rowIndex?: number): Promise<void> {
        try {
            console.log(`📝 Writing habit: ${habit.name} (${habit.id})`);
            const habitRow = this.convertHabitToRow(habit);

            let range: string;
            if (rowIndex !== undefined) {
                // 🔄 Update existing row
                range = `Habits!A${rowIndex + 2}:AW${rowIndex + 2}`; // +2 because of 1-based indexing and header
                console.log(`🔄 Updating existing row: ${rowIndex}`);
            } else {
                // ➕ Find next empty row or append
                const nextRow = await this.findNextEmptyRow(sheetId);
                range = `Habits!A${nextRow}:AW${nextRow}`;
                console.log(`➕ Appending to new row: ${nextRow}`);
            }

            const response = await fetch(
                `${HabitConstants.SHEETS_API_BASE}/${sheetId}/values/${range}?valueInputOption=RAW`,
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
                throw new Error(`Failed to write habit: ${response.status}`);
            }

            console.log('✅ Habit written successfully');

        } catch (error) {
            console.error('❌ Failed to write habit to sheet:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Xóa thói quen từ sheet
     * @param sheetId - ID sheet
     * @param habitId - ID thói quen cần xóa
     * @returns {Promise<void>}
     */
    async deleteHabit(sheetId: string, habitId: string): Promise<void> {
        try {
            console.log(`🗑️ Deleting habit: ${habitId}`);
            const habits = await this.readAllHabits(sheetId);
            const habitIndex = habits.findIndex(h => h.id === habitId);

            if (habitIndex === -1) {
                console.warn(`⚠️ Habit ${habitId} not found for deletion`);
                return;
            }

            // 🧹 Clear the row
            const rowNumber = habitIndex + 2; // +2 for header and 1-based indexing
            const range = `Habits!A${rowNumber}:AW${rowNumber}`;

            const response = await fetch(
                `${HabitConstants.SHEETS_API_BASE}/${sheetId}/values/${range}:clear`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete habit: ${response.status}`);
            }

            console.log('✅ Habit deleted successfully');

        } catch (error) {
            console.error('❌ Failed to delete habit from sheet:', error);
            throw error;
        }
    }

    /**
     * 🔄 Cập nhật giá trị cell cụ thể
     * @param sheetId - ID sheet
     * @param habitId - ID thói quen
     * @param columnName - Tên cột
     * @param value - Giá trị mới
     * @returns {Promise<void>}
     */
    async updateCellValue(
        sheetId: string,
        habitId: string,
        columnName: string,
        value: any
    ): Promise<void> {
        try {
            console.log(`🔄 Updating cell for habit ${habitId}, column ${columnName}`);
            const habits = await this.readAllHabits(sheetId);
            const habitIndex = habits.findIndex(h => h.id === habitId);

            if (habitIndex === -1) {
                throw new Error(`Habit ${habitId} not found`);
            }

            const columnIndex = HabitConstants.SHEET_HEADERS.indexOf(columnName);
            if (columnIndex === -1) {
                throw new Error(`Column ${columnName} not found`);
            }

            const rowNumber = habitIndex + 2;
            const columnLetter = this.getColumnLetter(columnIndex);
            const range = `Habits!${columnLetter}${rowNumber}`;

            const response = await fetch(
                `${HabitConstants.SHEETS_API_BASE}/${sheetId}/values/${range}?valueInputOption=RAW`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        values: [[value]]
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update cell: ${response.status}`);
            }

            console.log('✅ Cell updated successfully');

        } catch (error) {
            console.error('❌ Failed to update cell value:', error);
            throw error;
        }
    }

    /**
     * 📅 Cập nhật giá trị thói quen hàng ngày và tính lại streaks
     * @param sheetId - ID sheet
     * @param habitId - ID thói quen
     * @param day - Ngày trong tháng (1-31)
     * @param value - Giá trị tracking
     * @returns {Promise<Habit | null>} Thói quen đã cập nhật hoặc null
     */
    async updateDailyHabit(sheetId: string, habitId: string, day: number, value: number): Promise<Habit | null> {
        try {
            console.log(`📅 Updating daily habit ${habitId}, day ${day}, value ${value}`);

            if (day < 1 || day > 31) {
                throw new Error('Day must be between 1 and 31');
            }

            const habits = await this.readAllHabits(sheetId);
            const habit = habits.find(h => h.id === habitId);

            if (!habit) {
                throw new Error(`Habit ${habitId} not found`);
            }

            // 🔄 Update daily tracking
            const updatedDailyTracking = [...habit.dailyTracking];
            updatedDailyTracking[day - 1] = value;

            // 📈 Recalculate streaks
            const { currentStreak, longestStreak } = this.calculateStreaks(
                { ...habit, dailyTracking: updatedDailyTracking }
            );

            const updatedHabit: Habit = {
                ...habit,
                dailyTracking: updatedDailyTracking,
                currentStreak,
                longestStreak: Math.max(longestStreak, habit.longestStreak)
            };

            // 📝 Write back to sheet
            const habitIndex = habits.findIndex(h => h.id === habitId);
            await this.writeHabit(sheetId, updatedHabit, habitIndex);

            console.log('✅ Daily habit updated successfully');
            return updatedHabit;

        } catch (error) {
            console.error('❌ Failed to update daily habit:', error);
            throw error;
        }
    }

    /**
     * 📦 Batch update nhiều thói quen
     * @param sheetId - ID sheet
     * @param operations - Danh sách operations
     * @returns {Promise<void>}
     */
    async batchUpdateHabits(sheetId: string, operations: BatchOperation[]): Promise<void> {
        try {
            console.log(`📦 Processing batch update with ${operations.length} operations`);

            for (const operation of operations) {
                switch (operation.operation) {
                    case 'create':
                    case 'update':
                        // 📝 These require individual API calls due to complexity
                        if (operation.data) {
                            await this.writeHabit(sheetId, operation.data);
                        }
                        break;
                    case 'delete':
                        await this.deleteHabit(sheetId, operation.habitId);
                        break;
                }
            }

            console.log('✅ Batch update completed successfully');

        } catch (error) {
            console.error('❌ Failed to batch update habits:', error);
            throw error;
        }
    }

    // ========== HELPER METHODS ==========

    /**
     * 🔍 Tìm hàng trống tiếp theo trong sheet
     * @private
     * @param sheetId - ID sheet
     * @returns {Promise<number>} Số hàng tiếp theo
     */
    private async findNextEmptyRow(sheetId: string): Promise<number> {
        try {
            const response = await fetch(
                `${HabitConstants.SHEETS_API_BASE}/${sheetId}/values/Habits!A:A`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                return 2; // Default to row 2 if can't determine
            }

            const data = await response.json();
            const values = data.values || [];
            return values.length + 1;

        } catch (error) {
            console.warn('⚠️ Failed to find next empty row:', error);
            return 2;
        }
    }

    /**
     * 🔄 Chuyển habit object thành sheet row array
     * @private
     * @param habit - Habit object cần chuyển đổi
     * @returns {any[]} Mảng giá trị cho sheet row
     */
    private convertHabitToRow(habit: Habit): any[] {
        const row = new Array(HabitConstants.SHEET_HEADERS.length).fill('');

        // 🎯 Core properties
        row[0] = habit.id;
        row[1] = habit.name;
        row[2] = habit.description || '';
        row[3] = habit.habitType;
        row[4] = habit.difficultyLevel;
        row[5] = habit.goal || '';
        row[6] = habit.limit || '';
        row[7] = habit.currentStreak;

        // 📅 Daily tracking (columns 8-38)
        for (let i = 0; i < 31; i++) {
            row[8 + i] = habit.dailyTracking[i] ?? '';
        }

        // 📊 Additional properties (columns 39+)
        row[39] = habit.createdDate.toISOString();
        row[40] = habit.colorCode;
        row[41] = habit.longestStreak;
        row[42] = habit.category;
        row[43] = JSON.stringify(habit.tags);
        row[44] = habit.isArchived ? 'TRUE' : 'FALSE';
        row[45] = habit.isQuantifiable ? 'TRUE' : 'FALSE';
        row[46] = habit.unit || '';
        row[47] = habit.startTime || '';
        row[48] = JSON.stringify(habit.subtasks);

        return row;
    }

    /**
     * 🔄 Parse habit object từ sheet row array
     * @private
     * @param row - Mảng giá trị từ sheet
     * @returns {Habit | null} Habit object hoặc null nếu lỗi
     */
    private parseHabitFromRow(row: any[]): Habit | null {
        try {
            if (!row || row.length === 0 || !row[0]) return null;

            const dailyTracking = new Array(31).fill(null);
            for (let i = 0; i < 31; i++) {
                const value = row[8 + i];
                if (value !== undefined && value !== '') {
                    dailyTracking[i] = parseFloat(value) || 0;
                }
            }

            return {
                id: row[0],
                name: row[1] || '',
                description: row[2] || '',
                habitType: row[3] as any || 'good',
                difficultyLevel: parseInt(row[4]) || 1,
                goal: row[5] ? parseFloat(row[5]) : undefined,
                limit: row[6] ? parseFloat(row[6]) : undefined,
                currentStreak: parseInt(row[7]) || 0,
                dailyTracking,
                createdDate: new Date(row[39] || Date.now()),
                colorCode: row[40] || '#3b82f6',
                longestStreak: parseInt(row[41]) || 0,
                category: row[42] as any || 'other',
                tags: this.safeJsonParse(row[43], []),
                isArchived: row[44] === 'TRUE',
                isQuantifiable: row[45] === 'TRUE',
                unit: row[46] || '',
                startTime: row[47] || '',
                subtasks: this.safeJsonParse(row[48], [])
            };
        } catch (error) {
            console.error('❌ Failed to parse habit from row:', error);
            return null;
        }
    }

    /**
     * 📈 Tính toán current và longest streaks cho habit
     * @private
     * @param habit - Habit object cần tính streaks
     * @returns {{ currentStreak: number; longestStreak: number }} Kết quả streaks
     */
    private calculateStreaks(habit: Habit): { currentStreak: number; longestStreak: number } {
        const currentDate = new Date();
        const currentDay = currentDate.getDate();

        let currentStreak = 0;
        let longestStreak = habit.longestStreak;
        let tempStreak = 0;

        // 📆 Calculate streaks by going through all days up to today
        for (let day = 1; day <= currentDay; day++) {
            const isCompleted = this.isHabitCompletedForDay(habit, day);

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

    /**
     * ✅ Kiểm tra habit hoàn thành cho ngày cụ thể
     * @private
     * @param habit - Habit object
     * @param day - Ngày cần kiểm tra
     * @returns {boolean} True nếu hoàn thành
     */
    private isHabitCompletedForDay(habit: Habit, day: number): boolean {
        const dayIndex = day - 1;
        if (dayIndex < 0 || dayIndex >= habit.dailyTracking.length) return false;

        const value = habit.dailyTracking[dayIndex];
        if (value === null) return false;

        if (habit.habitType === 'good') {
            return habit.goal ? value >= habit.goal : value > 0;
        } else {
            return habit.limit ? value <= habit.limit : value === 0;
        }
    }

    /**
     * 🔤 Convert column index thành letter (A, B, C, ..., AA, AB, ...)
     * @private
     * @param index - Index cột
     * @returns {string} Chữ cái đại diện
     */
    private getColumnLetter(index: number): string {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode(65 + (index % 26)) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }

    /**
     * 🛡️ Safe JSON parse với fallback
     * @private
     * @param value - Giá trị cần parse
     * @param fallback - Fallback value nếu lỗi
     * @returns {any} Kết quả parse hoặc fallback
     */
    private safeJsonParse(value: any, fallback: any): any {
        if (!value || typeof value !== 'string') return fallback;
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
}