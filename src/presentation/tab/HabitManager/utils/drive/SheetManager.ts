import type { Habit } from '../../types/habit';
import { DriveApiClient } from './DriveApiClient';

export class SheetManager {
    constructor(private apiClient: DriveApiClient) { }

    async initializeSheetStructure(sheetId: string): Promise<void> {
        // Create HabitTracker sheet
        const requests = [
            {
                addSheet: {
                    properties: {
                        title: 'HabitTracker',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 50
                        }
                    }
                }
            }
        ];

        await this.apiClient.batchUpdateSheet(sheetId, requests);

        // Set headers
        const headers = this.createHeaders();
        await this.apiClient.updateSheetRange(sheetId, 'HabitTracker!A1:AW1', [headers]);

        // Setup data validation and formatting
        await this.setupDataValidation(sheetId);
        await this.setupConditionalFormatting(sheetId);

        // Remove default Sheet1
        await this.removeDefaultSheet(sheetId);
    }

    private createHeaders(): string[] {
        return [
            // Core Information (1-8)
            'id', 'name', 'description', 'habitType', 'difficultyLevel', 'goal', 'limit', 'currentStreak',
            // Daily Tracking (9-39) - 31 days
            ...Array.from({ length: 31 }, (_, i) => `${i + 1}`),
            // Additional Properties (40-50)
            'createdDate', 'colorCode', 'longestStreak', 'category', 'tags',
            'isArchived', 'isQuantifiable', 'unit', 'startTime', 'subtasks'
        ];
    }

    private async setupDataValidation(sheetId: string): Promise<void> {
        const requests = [
            this.createValidationRule(3, 4, ['good', 'bad']), // habitType
            this.createValidationRule(4, 5, ['1', '2', '3', '4', '5']), // difficultyLevel
            this.createValidationRule(42, 43, [
                'health', 'fitness', 'productivity', 'mindfulness',
                'learning', 'social', 'finance', 'creativity', 'other'
            ]), // category
            this.createValidationRule(44, 45, ['TRUE', 'FALSE']), // isArchived
            this.createValidationRule(45, 46, ['TRUE', 'FALSE'])  // isQuantifiable
        ];

        await this.apiClient.batchUpdateSheet(sheetId, requests);
    }

    private createValidationRule(startCol: number, endCol: number, values: string[]) {
        return {
            setDataValidation: {
                range: {
                    sheetId: 0,
                    startRowIndex: 1,
                    endRowIndex: 1000,
                    startColumnIndex: startCol,
                    endColumnIndex: endCol
                },
                rule: {
                    condition: {
                        type: 'ONE_OF_LIST',
                        values: values.map(value => ({ userEnteredValue: value }))
                    },
                    showCustomUi: true
                }
            }
        };
    }

    private async setupConditionalFormatting(sheetId: string): Promise<void> {
        const requests = [
            this.createConditionalFormatRule(
                '=AND($D2="good", I2>=$F2, I2<>"")',
                { red: 0.8, green: 1.0, blue: 0.8 }
            ),
            this.createConditionalFormatRule(
                '=AND($D2="good", I2<$F2, I2<>"")',
                { red: 1.0, green: 0.8, blue: 0.6 }
            ),
            this.createConditionalFormatRule(
                '=AND($D2="bad", I2<=$G2, I2<>"")',
                { red: 0.8, green: 1.0, blue: 0.8 }
            ),
            this.createConditionalFormatRule(
                '=AND($D2="bad", I2>$G2, I2<>"")',
                { red: 1.0, green: 0.6, blue: 0.6 }
            )
        ];

        await this.apiClient.batchUpdateSheet(sheetId, requests);
    }

    private createConditionalFormatRule(formula: string, backgroundColor: any) {
        return {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: 0,
                        startRowIndex: 1,
                        endRowIndex: 1000,
                        startColumnIndex: 8,
                        endColumnIndex: 39
                    }],
                    booleanRule: {
                        condition: {
                            type: 'CUSTOM_FORMULA',
                            values: [{ userEnteredValue: formula }]
                        },
                        format: { backgroundColor }
                    }
                }
            }
        };
    }

    private async removeDefaultSheet(sheetId: string): Promise<void> {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
                {
                    headers: { 'Authorization': `Bearer ${this.apiClient['accessToken']}` }
                }
            );

            const sheetData = await response.json();
            const defaultSheet = sheetData.sheets.find((s: any) => s.properties.title === 'Sheet1');

            if (defaultSheet) {
                await this.apiClient.batchUpdateSheet(sheetId, [{
                    deleteSheet: { sheetId: defaultSheet.properties.sheetId }
                }]);
            }
        } catch (error) {
            console.warn('Could not delete default sheet:', error);
        }
    }

    habitToRow(habit: Habit): string[] {
        return [
            habit.id,
            habit.name,
            habit.description || '',
            habit.habitType,
            habit.difficultyLevel.toString(),
            habit.goal?.toString() || '',
            habit.limit?.toString() || '',
            habit.currentStreak.toString(),
            ...habit.dailyTracking.map(val => val?.toString() || ''),
            habit.createdDate.toISOString().split('T')[0],
            habit.colorCode,
            habit.longestStreak.toString(),
            habit.category,
            JSON.stringify(habit.tags),
            habit.isArchived.toString().toUpperCase(),
            habit.isQuantifiable.toString().toUpperCase(),
            habit.unit || '',
            habit.startTime || '',
            JSON.stringify(habit.subtasks)
        ];
    }

    rowToHabit(row: string[]): Habit | null {
        if (!row[0]) return null;

        const dailyTracking: (number | null)[] = [];
        for (let i = 8; i < 39; i++) {
            const value = row[i];
            dailyTracking.push(value && !isNaN(Number(value)) ? Number(value) : null);
        }

        return {
            id: row[0] || '',
            name: row[1] || '',
            description: row[2] || '',
            habitType: (row[3] || 'good') as any,
            difficultyLevel: (parseInt(row[4]) || 1) as any,
            goal: row[5] ? parseInt(row[5]) : undefined,
            limit: row[6] ? parseInt(row[6]) : undefined,
            currentStreak: parseInt(row[7]) || 0,
            dailyTracking,
            createdDate: row[39] ? new Date(row[39]) : new Date(),
            colorCode: row[40] || '#3b82f6',
            longestStreak: parseInt(row[41]) || 0,
            category: (row[42] || 'other') as any,
            tags: this.parseJsonArray(row[43]),
            isArchived: row[44] === 'TRUE',
            isQuantifiable: row[45] === 'TRUE',
            unit: row[46] || '',
            startTime: row[47] || '',
            subtasks: this.parseJsonArray(row[48])
        };
    }

    private parseJsonArray(jsonStr: string): string[] {
        try {
            return jsonStr ? JSON.parse(jsonStr) : [];
        } catch {
            return [];
        }
    }
}