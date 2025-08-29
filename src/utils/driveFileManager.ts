// src/utils/driveFileManager.ts
// Auto-finds or creates FlexBookmark folder structure with comprehensive habit tracking
import type { Habit, HabitLog } from "../presentation/tab/HabitManager/hooks/useHabitData";

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

    // Create a new habit tracking sheet
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

    // Initialize sheet with comprehensive structure
    private async initializeSheetStructure(sheetId: string): Promise<void> {
        const requests = [
            // Clear existing sheets and create our custom sheets
            {
                addSheet: {
                    properties: {
                        title: 'Habits',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 50 // Increased to accommodate all columns
                        }
                    }
                }
            },
            {
                addSheet: {
                    properties: {
                        title: 'HabitLogs',
                        gridProperties: {
                            rowCount: 10000,
                            columnCount: 6
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

        // Create comprehensive headers for Habits sheet
        const habitsHeaders = [
            // PHẦN 1: THÔNG TIN CỐ ĐỊNH VỀ THÓI QUEN (A-H)
            'ID', // A
            'Tên Thói quen', // B
            'Mô tả', // C
            'Loại Thói quen', // D (Good/Bad)
            'Mục tiêu (Mỗi ngày)', // E
            'Đơn vị tính', // F
            'Cường độ/Khoảng lặp', // G
            'Mức độ Ưu tiên', // H

            // PHẦN 2: THEO DÕI HÀNG NGÀY (I-AI) - 31 cột cho 31 ngày
            ...Array.from({ length: 31 }, (_, i) => `Ngày ${i + 1}`), // I-AI (31 columns)

            // PHẦN 3: CỘT TỔNG KẾT & PHÂN TÍCH (AJ-AP)
            'Tổng số lần (Tháng)', // AJ
            'Số ngày đạt mục tiêu', // AK
            'Số ngày không đạt mục tiêu', // AL
            'Tỷ lệ thành công (%)', // AM
            'Trung bình mỗi ngày', // AN
            'Đánh giá cảm tính', // AO
            'Ghi chú tháng' // AP
        ];

        await this.updateRange(sheetId, 'Habits!A1:AP1', [habitsHeaders]);

        // Add headers to HabitLogs sheet (keeping original structure for compatibility)
        const logsHeaders = [
            ['Date', 'HabitID', 'Completed', 'Note', 'Timestamp']
        ];

        await this.updateRange(sheetId, 'HabitLogs!A1:E1', logsHeaders);

        // Set up data validation for key columns
        await this.setupDataValidation(sheetId);

        // Apply conditional formatting
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
                        sheetId: 0, // First sheet (Habits)
                        startRowIndex: 1, // Skip header
                        endRowIndex: 1000,
                        startColumnIndex: 3, // Column D (0-indexed)
                        endColumnIndex: 4
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [
                                { userEnteredValue: 'Good' },
                                { userEnteredValue: 'Bad' }
                            ]
                        },
                        showCustomUi: true
                    }
                }
            },
            // Data validation for daily tracking columns (I-AI) - numbers 0-10
            {
                setDataValidation: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 1,
                        endRowIndex: 1000,
                        startColumnIndex: 8, // Column I (0-indexed)
                        endColumnIndex: 39 // Column AI (0-indexed, I=8 + 31 columns = 39)
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: [
                                { userEnteredValue: '0' },
                                { userEnteredValue: '1' },
                                { userEnteredValue: '2' },
                                { userEnteredValue: '3' },
                                { userEnteredValue: '4' },
                                { userEnteredValue: '5' },
                                { userEnteredValue: '6' },
                                { userEnteredValue: '7' },
                                { userEnteredValue: '8' },
                                { userEnteredValue: '9' },
                                { userEnteredValue: '10' }
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
            // Conditional formatting for Good habits - achieved target (green)
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{
                            sheetId: 0,
                            startRowIndex: 1,
                            endRowIndex: 1000,
                            startColumnIndex: 8, // Column I
                            endColumnIndex: 39 // Column AI
                        }],
                        booleanRule: {
                            condition: {
                                type: 'CUSTOM_FORMULA',
                                values: [{
                                    userEnteredValue: '=AND($D2="Good", I2>=$E2)'
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
            // Conditional formatting for Good habits - not achieved target (orange)
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
                                    userEnteredValue: '=AND($D2="Good", I2<$E2, I2<>"")'
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
            // Conditional formatting for Bad habits - controlled well (green)
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
                                    userEnteredValue: '=AND($D2="Bad", I2<=$E2)'
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
            // Conditional formatting for Bad habits - exceeded limit (red)
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
                                    userEnteredValue: '=AND($D2="Bad", I2>$E2)'
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
                // Range doesn't exist, return empty array
                return [];
            }
            const errorText = await response.text();
            throw new Error(`Failed to read range ${range}: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.values || [];
    }

    // CRUD Operations for Habits - Updated for new comprehensive structure

    async readHabits(sheetId: string): Promise<Habit[]> {
        try {
            // Read only the basic habit info columns (A-H) for now
            const values = await this.readRange(sheetId, 'Habits!A2:H1000');

            return values.map(row => ({
                id: row[0] || '',
                name: row[1] || '',
                description: row[2] || '',
                frequency: (row[3] || 'daily') as 'daily' | 'weekly' | 'monthly',
                targetCount: parseInt(row[4]) || 1,
                currentCount: parseInt(row[5]) || 0,
                createdAt: row[6] ? new Date(row[6]) : new Date(),
                color: row[7] || '#3b82f6'
            })).filter(habit => habit.id); // Filter out empty rows
        } catch (error) {
            console.error('Error reading habits:', error);
            return [];
        }
    }

    async createHabit(sheetId: string, habit: Habit): Promise<void> {
        // For the comprehensive structure, we need to fill more columns
        const row = [
            habit.id, // A - ID
            habit.name, // B - Tên Thói quen
            habit.description || '', // C - Mô tả
            'Good', // D - Loại Thói quen (default to Good, can be updated later)
            habit.targetCount.toString(), // E - Mục tiêu (Mỗi ngày)
            'lần', // F - Đơn vị tính (default unit)
            '', // G - Cường độ/Khoảng lặp
            'Trung bình', // H - Mức độ Ưu tiên (default priority)

            // I-AI: Daily tracking columns (31 days) - initialize as empty
            ...Array(31).fill(''),

            // AJ-AP: Summary columns - will be calculated by formulas
            `=SUM(I2:AI2)`, // AJ - Tổng số lần (Tháng)
            `=COUNTIFS(I2:AI2,">="&E2)`, // AK - Số ngày đạt mục tiêu (for Good habits)
            `=COUNTIFS(I2:AI2,"<"&E2)`, // AL - Số ngày không đạt mục tiêu
            `=IFERROR(AK2/(AK2+AL2)*100,0)`, // AM - Tỷ lệ thành công (%)
            `=IFERROR(AJ2/COUNTA(I2:AI2),0)`, // AN - Trung bình mỗi ngày
            '', // AO - Đánh giá cảm tính
            '' // AP - Ghi chú tháng
        ];

        await this.appendRange(sheetId, 'Habits!A:AP', [row]);
    }

    async updateHabit(sheetId: string, habit: Habit): Promise<void> {
        // Find the row index for this habit
        const values = await this.readRange(sheetId, 'Habits!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habit.id);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2; // +2 because we start from A2 and arrays are 0-indexed

        // Only update the basic habit info columns (A-H), preserve daily tracking and formulas
        const row = [
            habit.id,
            habit.name,
            habit.description || '',
            'Good', // Keep as Good for now
            habit.targetCount.toString(),
            'lần',
            '',
            'Trung bình'
        ];

        await this.updateRange(sheetId, `Habits!A${actualRowIndex}:H${actualRowIndex}`, [row]);
    }

    async deleteHabit(sheetId: string, habitId: string): Promise<void> {
        // Find the row index for this habit
        const values = await this.readRange(sheetId, 'Habits!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habitId);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;

        // Clear the entire row (all columns A-AP)
        const emptyRow = Array(42).fill(''); // 42 columns total (A-AP)
        await this.updateRange(sheetId, `Habits!A${actualRowIndex}:AP${actualRowIndex}`, [emptyRow]);
    }

    // Method to update daily habit tracking
    async updateDailyHabit(sheetId: string, habitId: string, day: number, count: number): Promise<void> {
        if (day < 1 || day > 31) {
            throw new Error('Day must be between 1 and 31');
        }

        // Find the row index for this habit
        const values = await this.readRange(sheetId, 'Habits!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habitId);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2;
        const columnIndex = String.fromCharCode(72 + day); // Column I = 73, J = 74, etc.

        await this.updateRange(sheetId, `Habits!${columnIndex}${actualRowIndex}`, [[count.toString()]]);
    }

    // Get comprehensive habit data including daily tracking
    async getHabitWithTracking(sheetId: string, habitId: string): Promise<any> {
        const values = await this.readRange(sheetId, 'Habits!A2:AP1000');
        const habitRow = values.find(row => row[0] === habitId);

        if (!habitRow) {
            throw new Error('Habit not found');
        }

        return {
            id: habitRow[0],
            name: habitRow[1],
            description: habitRow[2],
            type: habitRow[3],
            target: parseInt(habitRow[4]) || 1,
            unit: habitRow[5],
            intensity: habitRow[6],
            priority: habitRow[7],
            dailyTracking: habitRow.slice(8, 39), // Days 1-31
            totalCount: habitRow[39],
            daysAchieved: habitRow[40],
            daysNotAchieved: habitRow[41],
            successRate: habitRow[42],
            dailyAverage: habitRow[43],
            feeling: habitRow[44],
            monthlyNote: habitRow[45]
        };
    }

    // CRUD Operations for Habit Logs - Keep original structure for compatibility

    async readHabitLogs(sheetId: string): Promise<HabitLog[]> {
        try {
            const values = await this.readRange(sheetId, 'HabitLogs!A2:E10000');

            return values.map(row => ({
                date: row[0] || '',
                habitId: row[1] || '',
                completed: row[2] === 'TRUE' || row[2] === true,
                note: row[3] || '',
                timestamp: parseInt(row[4]) || 0
            })).filter(log => log.date && log.habitId); // Filter out empty rows
        } catch (error) {
            console.error('Error reading habit logs:', error);
            return [];
        }
    }

    async logHabit(sheetId: string, log: HabitLog): Promise<void> {
        // Check if log already exists for this date and habit
        const existingLogs = await this.readHabitLogs(sheetId);
        const existingLogIndex = existingLogs.findIndex(
            l => l.date === log.date && l.habitId === log.habitId
        );

        const row = [
            log.date,
            log.habitId,
            log.completed.toString(),
            log.note || '',
            (log.timestamp || Date.now()).toString()
        ];

        if (existingLogIndex !== -1) {
            // Update existing log
            const actualRowIndex = existingLogIndex + 2; // +2 for header and 0-index
            await this.updateRange(sheetId, `HabitLogs!A${actualRowIndex}:E${actualRowIndex}`, [row]);
        } else {
            // Create new log
            await this.appendRange(sheetId, 'HabitLogs!A:E', [row]);
        }

        // Also update the daily tracking in the main Habits sheet
        const date = new Date(log.date);
        const day = date.getDate();
        const count = log.completed ? 1 : 0;

        try {
            await this.updateDailyHabit(sheetId, log.habitId, day, count);
        } catch (error) {
            console.warn('Could not update daily tracking:', error);
        }
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