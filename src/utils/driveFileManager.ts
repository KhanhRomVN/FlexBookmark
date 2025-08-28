// src/utils/driveFileManager.ts
import type { Habit, HabitLog } from "../presentation/tab/HabitManager/useHabitData";

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
    private selectedFolderId: string | null = null;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    // Update access token
    updateToken(newToken: string): void {
        this.accessToken = newToken;
    }

    // Set selected folder ID
    setSelectedFolder(folderId: string): void {
        this.selectedFolderId = folderId;
    }

    // Get selected folder ID
    getSelectedFolder(): string | null {
        return this.selectedFolderId;
    }

    // List folders for user selection
    async listFolders(parentId: string = 'root', query?: string): Promise<DriveFolder[]> {
        try {
            let searchQuery = `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
            if (query) {
                searchQuery += ` and name contains '${query}'`;
            }

            const response = await fetch(
                `${this.baseApiUrl}/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,parents)&orderBy=name`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to list folders: ${response.status}`);
            }

            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('Error listing folders:', error);
            throw error;
        }
    }

    // Create FlexBookmark folder in selected location
    async createFlexBookmarkFolder(parentId: string): Promise<string> {
        console.log('Creating FlexBookmark folder in parent:', parentId);

        // Check if FlexBookmark already exists
        const existingFolder = await this.findFolder('FlexBookmark', parentId);
        if (existingFolder) {
            console.log('FlexBookmark folder already exists:', existingFolder.id);
            this.selectedFolderId = existingFolder.id;
            return existingFolder.id;
        }

        // Create FlexBookmark folder
        const flexBookmarkFolder = await this.createFolder('FlexBookmark', parentId);
        this.selectedFolderId = flexBookmarkFolder.id;

        // Automatically create HabitManager subfolder and current month sheet
        await this.initializeHabitStructure(flexBookmarkFolder.id);

        return flexBookmarkFolder.id;
    }

    // Initialize habit management structure
    private async initializeHabitStructure(flexBookmarkFolderId: string): Promise<void> {
        const currentYear = new Date().getFullYear().toString();

        // Create HabitManager folder
        const habitManagerFolder = await this.createFolder('HabitManager', flexBookmarkFolderId);

        // Create year folder
        const yearFolder = await this.createFolder(currentYear, habitManagerFolder.id);

        // Create current month sheet
        const currentDate = new Date();
        const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const sheetName = `Habits_${monthYear}`;

        const existingSheet = await this.findFile(sheetName, yearFolder.id);
        if (!existingSheet) {
            await this.createHabitSheet(sheetName, yearFolder.id);
        }
    }

    // Create folder structure: HabitManager/2025/ (inside already selected FlexBookmark)
    private async createFolderStructure(parentId?: string): Promise<string> {
        console.log('Creating folder structure...');

        const currentYear = new Date().getFullYear().toString();
        let currentParentId = parentId || this.selectedFolderId;

        if (!currentParentId) {
            throw new Error('No folder selected. Please select a FlexBookmark folder first.');
        }

        // Create HabitManager folder
        const habitManagerFolder = await this.createFolder('HabitManager', currentParentId);
        currentParentId = habitManagerFolder.id;

        // Create year folder
        const yearFolder = await this.createFolder(currentYear, currentParentId);

        return yearFolder.id;
    }

    // Create a folder
    private async createFolder(name: string, parentId: string): Promise<DriveFolder> {
        // First check if folder already exists
        const existingFolder = await this.findFolder(name, parentId);
        if (existingFolder) {
            console.log(`Folder "${name}" already exists:`, existingFolder.id);
            return existingFolder;
        }

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

    // Get current month sheet (create if not exists)
    async getCurrentMonthSheet(): Promise<string> {
        if (!this.selectedFolderId) {
            throw new Error('No FlexBookmark folder selected');
        }

        const currentDate = new Date();
        const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const sheetName = `Habits_${monthYear}`;

        // Create folder structure first
        const yearFolderId = await this.createFolderStructure();

        // Check if sheet already exists
        const existingSheet = await this.findFile(sheetName, yearFolderId);
        if (existingSheet) {
            console.log(`Sheet "${sheetName}" already exists:`, existingSheet.id);
            return existingSheet.id;
        }

        // Create new sheet
        console.log(`Creating new sheet: ${sheetName}`);
        const sheetId = await this.createHabitSheet(sheetName, yearFolderId);
        return sheetId;
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

    // Initialize sheet with proper structure
    private async initializeSheetStructure(sheetId: string): Promise<void> {
        const requests = [
            // Clear existing sheets and create our custom sheets
            {
                addSheet: {
                    properties: {
                        title: 'Habits',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 10
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

        // Add headers to Habits sheet
        const habitsHeaders = [
            ['ID', 'Name', 'Description', 'Frequency', 'TargetCount', 'CurrentCount', 'CreatedAt', 'Color']
        ];

        await this.updateRange(sheetId, 'Habits!A1:H1', habitsHeaders);

        // Add headers to HabitLogs sheet
        const logsHeaders = [
            ['Date', 'HabitID', 'Completed', 'Note', 'Timestamp']
        ];

        await this.updateRange(sheetId, 'HabitLogs!A1:E1', logsHeaders);

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

    // CRUD Operations for Habits

    async readHabits(sheetId: string): Promise<Habit[]> {
        try {
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
        const row = [
            habit.id,
            habit.name,
            habit.description || '',
            habit.frequency,
            habit.targetCount.toString(),
            habit.currentCount.toString(),
            habit.createdAt.toISOString(),
            habit.color || '#3b82f6'
        ];

        await this.appendRange(sheetId, 'Habits!A:H', [row]);
    }

    async updateHabit(sheetId: string, habit: Habit): Promise<void> {
        // Find the row index for this habit
        const values = await this.readRange(sheetId, 'Habits!A2:A1000');
        const rowIndex = values.findIndex(row => row[0] === habit.id);

        if (rowIndex === -1) {
            throw new Error('Habit not found');
        }

        const actualRowIndex = rowIndex + 2; // +2 because we start from A2 and arrays are 0-indexed
        const row = [
            habit.id,
            habit.name,
            habit.description || '',
            habit.frequency,
            habit.targetCount.toString(),
            habit.currentCount.toString(),
            habit.createdAt.toISOString(),
            habit.color || '#3b82f6'
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

        // Clear the row
        await this.updateRange(sheetId, `Habits!A${actualRowIndex}:H${actualRowIndex}`, [['', '', '', '', '', '', '', '']]);
    }

    // CRUD Operations for Habit Logs

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