// src/utils/driveFileManager.ts
// Enhanced DriveFileManager with 52-column single-sheet structure for comprehensive habit tracking

import type { Habit, HabitType, DifficultyLevel, HabitCategory } from "../presentation/tab/HabitManager/types/habit";

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
    private accessToken: string;
    private baseApiUrl = 'https://www.googleapis.com/drive/v3';
    private sheetsApiUrl = 'https://sheets.googleapis.com/v4';
    private flexBookmarkFolderId: string | null = null;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    // Update access token
    updateToken(newToken: string): void {
        this.accessToken = newToken;
    }

    // Auto-initialize: find or create FlexBookmark folder structure
    async autoInitialize(): Promise<string> {
        console.log('Auto-initializing FlexBookmark folder structure...');

        // Step 1: Find or create FlexBookmark folder in root
        let flexBookmarkFolder = await this.findFolder('FlexBookmark', 'root');
        if (!flexBookmarkFolder) {
            console.log('FlexBookmark folder not found, creating it...');
            flexBookmarkFolder = await this.createFolder('FlexBookmark', 'root');
        } else {
            console.log('FlexBookmark folder found:', flexBookmarkFolder.id);
        }

        this.flexBookmarkFolderId = flexBookmarkFolder.id;

        // Step 2: Find or create HabitManager subfolder
        let habitManagerFolder = await this.findFolder('HabitManager', flexBookmarkFolder.id);
        if (!habitManagerFolder) {
            console.log('HabitManager folder not found, creating it...');
            habitManagerFolder = await this.createFolder('HabitManager', flexBookmarkFolder.id);
        } else {
            console.log('HabitManager folder found:', habitManagerFolder.id);
        }

        // Step 3: Find or create current year folder
        const currentYear = new Date().getFullYear().toString();
        let yearFolder = await this.findFolder(currentYear, habitManagerFolder.id);
        if (!yearFolder) {
            console.log(`${currentYear} folder not found, creating it...`);
            yearFolder = await this.createFolder(currentYear, habitManagerFolder.id);
        } else {
            console.log(`${currentYear} folder found:`, yearFolder.id);
        }

        // Step 4: Find or create current month sheet
        const currentDate = new Date();
        const monthYear = `flex_bookmark_${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentYear}`;

        let habitSheet = await this.findFile(monthYear, yearFolder.id);
        if (!habitSheet) {
            console.log(`${monthYear} sheet not found, creating it...`);
            const sheetId = await this.createHabitSheet(monthYear, yearFolder.id);
            return sheetId;
        } else {
            console.log(`${monthYear} sheet found:`, habitSheet.id);
            return habitSheet.id;
        }
    }

    // Create a folder
    private async createFolder(name: string, parentId: string): Promise<DriveFolder> {
        console.log(`Creating folder: ${name} in parent: ${parentId}`);

        const folderMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };

        const response = await fetch(`${this.baseApiUrl}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(folderMetadata),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error creating folder:', errorText);
            throw new Error(`Failed to create folder "${name}": ${response.status} - ${errorText}`);
        }

        const folder = await response.json();
        console.log(`Created folder "${name}":`, folder.id);
        return folder;
    }

    // Find a folder by name and parent
    private async findFolder(name: string, parentId: string): Promise<DriveFolder | null> {
        try {
            const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const response = await fetch(
                `${this.baseApiUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,parents)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                console.warn(`Error searching for folder "${name}":`, response.status);
                return null;
            }

            const data = await response.json();
            return data.files && data.files.length > 0 ? data.files[0] : null;
        } catch (error) {
            console.warn(`Error finding folder "${name}":`, error);
            return null;
        }
    }

    // Find a file by name and parent
    private async findFile(name: string, parentId: string): Promise<DriveFile | null> {
        try {
            const query = `name='${name}' and '${parentId}' in parents and trashed=false`;
            const response = await fetch(
                `${this.baseApiUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,parents)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                console.warn(`Error searching for file "${name}":`, response.status);
                return null;
            }

            const data = await response.json();
            return data.files && data.files.length > 0 ? data.files[0] : null;
        } catch (error) {
            console.warn(`Error finding file "${name}":`, error);
            return null;
        }
    }

    // Create a new habit tracking sheet with 52-column structure
    private async createHabitSheet(name: string, parentId: string): Promise<string> {
        const sheetMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [parentId]
        };

        // Create the spreadsheet
        const response = await fetch(`${this.baseApiUrl}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetMetadata),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create sheet: ${response.status} - ${errorText}`);
        }

        const sheet = await response.json();
        const sheetId = sheet.id;

        // Initialize the sheet structure
        await this.initializeSheetStructure(sheetId);

        console.log(`Created habit sheet "${name}":`, sheetId);
        return sheetId;
    }

    // Helper method to convert column number to Excel column letter
    private getColumnLetter(columnNumber: number): string {
        let result = '';
        while (columnNumber > 0) {
            columnNumber--; // Make it 0-indexed
            result = String.fromCharCode(65 + (columnNumber % 26)) + result;
            columnNumber = Math.floor(columnNumber / 26);
        }
        return result;
    }

    // Initialize sheet with comprehensive 52-column structure
    private async initializeSheetStructure(sheetId: string): Promise<void> {
        const requests = [
            // Clear existing sheets and create our custom sheet
            {
                addSheet: {
                    properties: {
                        title: 'HabitTracker',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 52 // Exactly 52 columns for our structure
                        }
                    }
                }
            }
        ];

        // Execute batch update to create sheets
        await fetch(`${this.sheetsApiUrl}/spreadsheets/${sheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests }),
        });

        // Create comprehensive headers for 52-column structure
        const headers = [
            // Core Information (1-8)
            'ID',                    // A
            'Tên Thói quen',        // B
            'Mô tả',                // C
            'Loại Thói quen',       // D (good/bad)
            'Mức độ Khó',          // E (1-5)
            'Mục tiêu',            // F (for good habits)
            'Giới hạn',            // G (for bad habits)
            'Chuỗi Hiện tại',      // H

            // Daily Tracking (9-39) - 31 days
            ...Array.from({ length: 31 }, (_, i) => `Ngày ${i + 1}`), // I-AM (31 columns)

            // Additional Properties (40-52)
            'Ngày tạo',            // AN - createdDate
            'Mã màu',              // AO - colorCode
            'Emoji',               // AP - emoji
            'Chuỗi Dài nhất',      // AQ - longestStreak
            'Danh mục',            // AR - category
            'Tags',                // AS - tags (JSON string)
            'Đã lưu trữ',          // AT - isArchived
            'Lý do/Động lực',      // AU - whyReason
            'Có thể đo lường',     // AV - isQuantifiable
            'Đơn vị',              // AW - unit
            'Thời gian bắt đầu',   // AX - startTime
            'Các bước con',        // AY - subtasks (JSON string)
        ];

        console.log(`Headers count: ${headers.length}`); // Should be 52

        // Set headers
        await this.updateRange(sheetId, 'HabitTracker!A1:AY1', [headers]);

        // Set up data validation and conditional formatting
        await this.setupDataValidation(sheetId);
        await this.setupConditionalFormatting(sheetId);

        // Delete the default Sheet1
        try {
            const sheetResponse = await fetch(`${this.sheetsApiUrl}/spreadsheets/${sheetId}`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            const sheetData = await sheetResponse.json();
            const defaultSheet = sheetData.sheets.find((s: any) => s.properties.title === 'Sheet1');

            if (defaultSheet) {
                await fetch(`${this.sheetsApiUrl}/spreadsheets/${sheetId}:batchUpdate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requests: [{
                            deleteSheet: {
                                sheetId: defaultSheet.properties.sheetId
                            }
                        }]
                    }),
                });
            }
        } catch (error) {
            console.warn('Could not delete default sheet:', error);
        }
    }

    // Helper method to set up data validation
    private async setupDataValidation(sheetId: string): Promise<void> {
        const requests = [
            // Data validation for "Loại Thói quen" column (D)
            {
                setDataValidation: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 1,
                        endRowIndex: 1000,
                        startColumnIndex: 3, // Column D
                        endColumnIndex: 4
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [
                                { userEnteredValue: 'good' },
                                { userEnteredValue: 'bad' }
                            ]
                        },
                        showCustomUi: true
                    }
                }
            },
            // Data validation for difficulty level (E)
            {
                setDataValidation: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 1,
                        endRowIndex: 1000,
                        startColumnIndex: 4, // Column E
                        endColumnIndex: 5
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [
                                { userEnteredValue: '1' },
                                { userEnteredValue: '2' },
                                { userEnteredValue: '3' },
                                { userEnteredValue: '4' },
                                { userEnteredValue: '5' }
                            ]
                        },
                        showCustomUi: true
                    }
                }
            },
            // Data validation for category (AR)
            {
                setDataValidation: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 1,
                        endRowIndex: 1000,
                        startColumnIndex: 43, // Column AR
                        endColumnIndex: 44
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [
                                { userEnteredValue: 'health' },
                                { userEnteredValue: 'fitness' },
                                { userEnteredValue: 'productivity' },
                                { userEnteredValue: 'mindfulness' },
                                { userEnteredValue: 'learning' },
                                { userEnteredValue: 'social' },
                                { userEnteredValue: 'finance' },
                                { userEnteredValue: 'creativity' },
                                { userEnteredValue: 'other' }
                            ]
                        },
                        showCustomUi: true
                    }
                }
            },
            // Data validation for isArchived (AT)
            {
                setDataValidation: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 1,
                        endRowIndex: 1000,
                        startColumnIndex: 45, // Column AT
                        endColumnIndex: 46
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [
                                { userEnteredValue: 'TRUE' },
                                { userEnteredValue: 'FALSE' }
                            ]
                        },
                        showCustomUi: true
                    }
                }
            },
            // Data validation for isQuantifiable (AV)
            {
                setDataValidation: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 1,
                        endRowIndex: 1000,
                        startColumnIndex: 47, // Column AV
                        endColumnIndex: 48
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [
                                { userEnteredValue: 'TRUE' },
                                { userEnteredValue: 'FALSE' }
                            ]
                        },
                        showCustomUi: true
                    }
                }
            }
        ];

        await fetch(`${this.sheetsApiUrl}/spreadsheets/${sheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests }),
        });
    }

    // Helper method to set up conditional formatting
    private async setupConditionalFormatting(sheetId: string): Promise<void> {
        const requests = [
            // Good habits - achieved target (green)
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{
                            sheetId: 0,
                            startRowIndex: 1,
                            endRowIndex: 1000,
                            startColumnIndex: 8, // Column I
                            endColumnIndex: 39 // Column AM (31 daily columns)
                        }],
                        booleanRule: {
                            condition: {
                                type: 'CUSTOM_FORMULA',
                                values: [{
                                    userEnteredValue: '=AND($D2="good", I2>=$F2, I2<>"")'
                                }]
                            },
                            format: {
                                backgroundColor: {
                                    red: 0.8,
                                    green: 1.0,
                                    blue: 0.8
                                }
                            }
                        }
                    },
                    index: 0
                }
            },
            // Good habits - not achieved target (orange)
            {
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
                                values: [{
                                    userEnteredValue: '=AND($D2="good", I2<$F2, I2<>"")'
                                }]
                            },
                            format: {
                                backgroundColor: {
                                    red: 1.0,
                                    green: 0.8,
                                    blue: 0.6
                                }
                            }
                        }
                    },
                    index: 1
                }
            },
            // Bad habits - within limit (green)
            {
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
                                values: [{
                                    userEnteredValue: '=AND($D2="bad", I2<=$G2, I2<>"")'
                                }]
                            },
                            format: {
                                backgroundColor: {
                                    red: 0.8,
                                    green: 1.0,
                                    blue: 0.8
                                }
                            }
                        }
                    },
                    index: 2
                }
            },
            // Bad habits - exceeded limit (red)
            {
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
                                values: [{
                                    userEnteredValue: '=AND($D2="bad", I2>$G2, I2<>"")'
                                }]
                            },
                            format: {
                                backgroundColor: {
                                    red: 1.0,
                                    green: 0.6,
                                    blue: 0.6
                                }
                            }
                        }
                    },
                    index: 3
                }
            }
        ];

        await fetch(`${this.sheetsApiUrl}/spreadsheets/${sheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests }),
        });
    }

    // Update a range in the sheet
    private async updateRange(sheetId: string, range: string, values: any[][]): Promise<void> {
        const response = await fetch(
            `${this.sheetsApiUrl}/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update range ${range}: ${response.status} - ${errorText}`);
        }
    }

    // Append data to a range
    private async appendRange(sheetId: string, range: string, values: any[][]): Promise<void> {
        const response = await fetch(
            `${this.sheetsApiUrl}/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to append to range ${range}: ${response.status} - ${errorText}`);
        }
    }

    // Read data from a range
    private async readRange(sheetId: string, range: string): Promise<any[][]> {
        const response = await fetch(
            `${this.sheetsApiUrl}/spreadsheets/${sheetId}/values/${range}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 400) {
                return [];
            }
            const errorText = await response.text();
            throw new Error(`Failed to read range ${range}: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.values || [];
    }

    // CRUD Operations for Habits with 52-column structure

    async readHabits(sheetId: string): Promise<Habit[]> {
        try {
            // Read all 52 columns
            const values = await this.readRange(sheetId, 'HabitTracker!A2:AY1000');

            return values.map(row => {
                // Parse daily tracking array (columns I-AM, indices 8-38)
                const dailyTracking: (number | null)[] = [];
                for (let i = 8; i < 39; i++) {
                    const value = row[i];
                    dailyTracking.push(value && !isNaN(Number(value)) ? Number(value) : null);
                }

                // Parse JSON fields safely
                const parseTags = (tagsStr: string): string[] => {
                    try {
                        return tagsStr ? JSON.parse(tagsStr) : [];
                    } catch {
                        return [];
                    }
                };

                const parseSubtasks = (subtasksStr: string): string[] => {
                    try {
                        return subtasksStr ? JSON.parse(subtasksStr) : [];
                    } catch {
                        return [];
                    }
                };

                return {
                    id: row[0] || '',
                    name: row[1] || '',
                    description: row[2] || '',
                    habitType: (row[3] || 'good') as HabitType,
                    difficultyLevel: (parseInt(row[4]) || 1) as DifficultyLevel,
                    goal: row[5] ? parseInt(row[5]) : undefined,
                    limit: row[6] ? parseInt(row[6]) : undefined,
                    currentStreak: parseInt(row[7]) || 0,
                    dailyTracking,
                    createdDate: row[39] ? new Date(row[39]) : new Date(),
                    colorCode: row[40] || '#3b82f6',
                    emoji: row[41] || '',
                    longestStreak: parseInt(row[42]) || 0,
                    category: (row[43] || 'other') as HabitCategory,
                    tags: parseTags(row[44] || ''),
                    isArchived: row[45] === 'TRUE',
                    whyReason: row[46] || '',
                    isQuantifiable: row[47] === 'TRUE',
                    unit: row[48] || '',
                    startTime: row[49] || '',
                    subtasks: parseSubtasks(row[50] || '')
                } as Habit;
            }).filter(habit => habit.id); // Filter out empty rows
        } catch (error) {
            console.error('Error reading habits:', error);
            return [];
        }
    }

    async createHabit(sheetId: string, habit: Habit): Promise<void> {
        // Create row with all 52 columns (A-AY)
        const row = [
            habit.id,                                    // A - ID
            habit.name,                                  // B - Tên Thói quen
            habit.description || '',                     // C - Mô tả
            habit.habitType,                            // D - Loại Thói quen
            habit.difficultyLevel.toString(),           // E - Mức độ Khó
            habit.goal?.toString() || '',               // F - Mục tiêu
            habit.limit?.toString() || '',              // G - Giới hạn
            habit.currentStreak.toString(),             // H - Chuỗi Hiện tại

            // Daily tracking (31 columns I-AM)
            ...Array(31).fill(''),

            habit.createdDate.toISOString().split('T')[0], // AN - Ngày tạo
            habit.colorCode,                            // AO - Mã màu
            habit.emoji || '',                          // AP - Emoji
            habit.longestStreak.toString(),             // AQ - Chuỗi Dài nhất
            habit.category,                             // AR - Danh mục
            JSON.stringify(habit.tags),                 // AS - Tags
            habit.isArchived.toString().toUpperCase(),  // AT - Đã lưu trữ
            habit.whyReason || '',                      // AU - Lý do/Động lực
            habit.isQuantifiable.toString().toUpperCase(), // AV - Có thể đo lường
            habit.unit || '',                           // AW - Đơn vị
            habit.startTime || '',                      // AX - Thời gian bắt đầu
            JSON.stringify(habit.subtasks)              // AY - Các bước con
        ];

        await this.appendRange(sheetId, 'HabitTracker!A:AY', [row]);
    }

    async updateHabit(sheetId: string, habit: Habit): Promise<void> {
        // Find the row index for this habit
        const values = await this.readRange(sheetId, 'HabitTracker!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habit.id);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2; // +2 because we start from A2 and arrays are 0-indexed

        // Update entire row with all 52 columns
        const row = [
            habit.id,                                    // A
            habit.name,                                  // B
            habit.description || '',                     // C
            habit.habitType,                            // D
            habit.difficultyLevel.toString(),           // E
            habit.goal?.toString() || '',               // F
            habit.limit?.toString() || '',              // G
            habit.currentStreak.toString(),             // H

            // Daily tracking (preserve existing values or use new ones)
            ...habit.dailyTracking.map(val => val?.toString() || ''),

            habit.createdDate.toISOString().split('T')[0], // AN
            habit.colorCode,                            // AO
            habit.emoji || '',                          // AP
            habit.longestStreak.toString(),             // AQ
            habit.category,                             // AR
            JSON.stringify(habit.tags),                 // AS
            habit.isArchived.toString().toUpperCase(),  // AT
            habit.whyReason || '',                      // AU
            habit.isQuantifiable.toString().toUpperCase(), // AV
            habit.unit || '',                           // AW
            habit.startTime || '',                      // AX
            JSON.stringify(habit.subtasks)              // AY
        ];

        await this.updateRange(sheetId, `HabitTracker!A${actualRowIndex}:AY${actualRowIndex}`, [row]);
    }

    async deleteHabit(sheetId: string, habitId: string): Promise<void> {
        // Find the row index for this habit
        const values = await this.readRange(sheetId, 'HabitTracker!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habitId);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;

        // Clear the entire row (52 columns)
        const emptyRow = Array(52).fill('');
        await this.updateRange(sheetId, `HabitTracker!A${actualRowIndex}:AY${actualRowIndex}`, [emptyRow]);
    }

    // Method to update daily habit tracking for a specific day
    async updateDailyHabit(sheetId: string, habitId: string, day: number, value: number): Promise<void> {
        if (day < 1 || day > 31) {
            throw new Error('Day must be between 1 and 31');
        }

        // Find the row index for this habit
        const values = await this.readRange(sheetId, 'HabitTracker!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habitId);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;
        // Column I = index 8, so day 1 is column I (8+0), day 2 is column J (8+1), etc.
        const columnIndex = 8 + day - 1;
        const columnLetter = this.getColumnLetter(columnIndex + 1); // +1 because getColumnLetter expects 1-based

        await this.updateRange(sheetId, `HabitTracker!${columnLetter}${actualRowIndex}`, [[value.toString()]]);

        // After updating daily value, recalculate and update streaks
        await this.updateHabitStreaks(sheetId, habitId);
    }

    // Method to update habit streaks after daily tracking changes
    private async updateHabitStreaks(sheetId: string, habitId: string): Promise<void> {
        // Read the full habit data
        const habits = await this.readHabits(sheetId);
        const habit = habits.find(h => h.id === habitId);

        if (!habit) return;

        // Calculate new streaks
        const currentDate = new Date();
        const currentDay = currentDate.getDate();

        let currentStreak = 0;
        let longestStreak = habit.longestStreak;
        let tempStreak = 0;

        // Calculate streaks by going through all days up to today
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

        // Update streaks in the sheet
        const values = await this.readRange(sheetId, 'HabitTracker!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habitId);

        if (rowIndex !== -1) {
            const actualRowIndex = rowIndex + 2;

            // Update current streak (column H) and longest streak (column AQ)
            await this.updateRange(sheetId, `HabitTracker!H${actualRowIndex}`, [[currentStreak.toString()]]);
            await this.updateRange(sheetId, `HabitTracker!AQ${actualRowIndex}`, [[longestStreak.toString()]]);
        }
    }

    // Get habit with comprehensive tracking data
    async getHabitWithTracking(sheetId: string, habitId: string): Promise<Habit | null> {
        const habits = await this.readHabits(sheetId);
        return habits.find(habit => habit.id === habitId) || null;
    }

    // Archive/Unarchive habit
    async archiveHabit(sheetId: string, habitId: string, archive: boolean): Promise<void> {
        const values = await this.readRange(sheetId, 'HabitTracker!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habitId);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;
        await this.updateRange(sheetId, `HabitTracker!AT${actualRowIndex}`, [[archive.toString().toUpperCase()]]);
    }

    // Get habits by category
    async getHabitsByCategory(sheetId: string, category: HabitCategory): Promise<Habit[]> {
        const habits = await this.readHabits(sheetId);
        return habits.filter(habit => habit.category === category);
    }

    // Get habits by type
    async getHabitsByType(sheetId: string, habitType: HabitType): Promise<Habit[]> {
        const habits = await this.readHabits(sheetId);
        return habits.filter(habit => habit.habitType === habitType);
    }

    // Get active (non-archived) habits
    async getActiveHabits(sheetId: string): Promise<Habit[]> {
        const habits = await this.readHabits(sheetId);
        return habits.filter(habit => !habit.isArchived);
    }

    // Test drive permissions
    async testDriveAccess(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseApiUrl}/files?pageSize=1`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Drive access test failed:', error);
            return false;
        }
    }
}