export class SheetService {
    private accessToken: string;
    private spreadsheetId: string | null = null;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private checkAuth() {
        if (!this.accessToken) {
            throw new Error('Authentication required');
        }
    }

    private async makeGoogleSheetsRequest(url: string, options: RequestInit = {}, retryCount = 3): Promise<any> {
        this.checkAuth();

        for (let i = 0; i < retryCount; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                });

                if (response.status === 429) {
                    // Exponential backoff for rate limiting
                    const backoffTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                    continue;
                }

                if (response.status === 401) {
                    throw new Error('Authentication expired. Please sign in again.');
                }

                if (!response.ok) {
                    throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
                }

                return response.json();
            } catch (error) {
                if (i === retryCount - 1) throw error;

                // Exponential backoff for other errors
                const backoffTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }
    }

    async setupDrive(): Promise<string> {
        this.checkAuth();

        try {
            // 1. Tìm hoặc tạo thư mục FlexBookmark
            const flexBookmarkFolderResponse = await this.makeGoogleSheetsRequest(
                'https://www.googleapis.com/drive/v3/files?q=name="FlexBookmark" and mimeType="application/vnd.google-apps.folder" and trashed=false'
            );

            let flexBookmarkFolderId;
            if (flexBookmarkFolderResponse.files.length === 0) {
                // Tạo thư mục FlexBookmark
                const createFolderResponse = await this.makeGoogleSheetsRequest(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: 'FlexBookmark',
                            mimeType: 'application/vnd.google-apps.folder'
                        })
                    }
                );
                flexBookmarkFolderId = createFolderResponse.id;
            } else {
                flexBookmarkFolderId = flexBookmarkFolderResponse.files[0].id;
            }

            // 2. Tìm hoặc tạo thư mục HabitManager trong FlexBookmark
            const habitManagerFolderResponse = await this.makeGoogleSheetsRequest(
                `https://www.googleapis.com/drive/v3/files?q=name="HabitManager" and mimeType="application/vnd.google-apps.folder" and trashed=false and "${flexBookmarkFolderId}" in parents`
            );

            let habitManagerFolderId;
            if (habitManagerFolderResponse.files.length === 0) {
                // Tạo thư mục HabitManager
                const createFolderResponse = await this.makeGoogleSheetsRequest(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: 'HabitManager',
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [flexBookmarkFolderId]
                        })
                    }
                );
                habitManagerFolderId = createFolderResponse.id;
            } else {
                habitManagerFolderId = habitManagerFolderResponse.files[0].id;
            }

            // 3. Tìm hoặc tạo thư mục năm hiện tại trong HabitManager
            const currentYear = new Date().getFullYear().toString();
            const yearFolderResponse = await this.makeGoogleSheetsRequest(
                `https://www.googleapis.com/drive/v3/files?q=name="${currentYear}" and mimeType="application/vnd.google-apps.folder" and trashed=false and "${habitManagerFolderId}" in parents`
            );

            let yearFolderId;
            if (yearFolderResponse.files.length === 0) {
                // Tạo thư mục năm
                const createFolderResponse = await this.makeGoogleSheetsRequest(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: currentYear,
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [habitManagerFolderId]
                        })
                    }
                );
                yearFolderId = createFolderResponse.id;
            } else {
                yearFolderId = yearFolderResponse.files[0].id;
            }

            // 4. Tạo hoặc tìm spreadsheet cho tháng hiện tại trong thư mục năm
            const now = new Date();
            const monthYear = `${now.getMonth() + 1}_${now.getFullYear()}`;
            const spreadsheetName = `flexBookmark_habitManager_${monthYear}`;

            const spreadsheetResponse = await this.makeGoogleSheetsRequest(
                `https://www.googleapis.com/drive/v3/files?q=name="${spreadsheetName}" and mimeType="application/vnd.google-apps.spreadsheet" and trashed=false and "${yearFolderId}" in parents`
            );

            if (spreadsheetResponse.files.length === 0) {
                // Tạo spreadsheet mới
                const createSpreadsheetResponse = await this.makeGoogleSheetsRequest(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: spreadsheetName,
                            mimeType: 'application/vnd.google-apps.spreadsheet',
                            parents: [yearFolderId]
                        })
                    }
                );

                this.spreadsheetId = createSpreadsheetResponse.id;

                // Khởi tạo spreadsheet với headers
                await this.initializeSpreadsheet();
            } else {
                this.spreadsheetId = spreadsheetResponse.files[0].id;
            }

            return this.spreadsheetId!;
        } catch (error) {
            console.error('Error setting up Drive:', error);
            throw error;
        }
    }

    private async initializeSpreadsheet() {
        if (!this.spreadsheetId) return;

        const headers = [
            'id', 'name', 'description', 'habitType', 'difficultyLevel', 'goal', 'limit',
            'currentStreak', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
            '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25',
            '26', '27', '28', '29', '30', '31', 'createdDate', 'colorCode', 'longestStreak',
            'category', 'tags', 'isArchived', 'isQuantifiable', 'unit', 'startTime', 'subtasks'
        ];

        await this.makeGoogleSheetsRequest(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A1:AX1?valueInputOption=RAW`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    values: [headers]
                })
            }
        );
    }

    async fetchRowsFromSheet(): Promise<any[][]> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            const response = await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A2:AX`
            );

            return response.values || [];
        } catch (error) {
            console.error('Error fetching rows from sheet:', error);
            throw error;
        }
    }

    async appendRow(row: any[]): Promise<void> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A2:AX2:append?valueInputOption=RAW`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        values: [row]
                    })
                }
            );
        } catch (error) {
            console.error('Error appending row:', error);
            throw error;
        }
    }

    async updateRow(rowIndex: number, row: any[]): Promise<void> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            const range = `A${rowIndex + 2}:AX${rowIndex + 2}`;
            await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        values: [row]
                    })
                }
            );
        } catch (error) {
            console.error('Error updating row:', error);
            throw error;
        }
    }

    async deleteRow(rowIndex: number): Promise<void> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/batchUpdate`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        requests: [{
                            deleteDimension: {
                                range: {
                                    sheetId: 0,
                                    dimension: 'ROWS',
                                    startIndex: rowIndex + 1,
                                    endIndex: rowIndex + 2
                                }
                            }
                        }]
                    })
                }
            );
        } catch (error) {
            console.error('Error deleting row:', error);
            throw error;
        }
    }

    async findRowIndex(column: string, value: string): Promise<number> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            const response = await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${column}2:${column}`
            );

            if (!response.values) {
                return -1;
            }

            return response.values.findIndex(([cellValue]: [string]) => cellValue === value);
        } catch (error) {
            console.error('Error finding row index:', error);
            throw error;
        }
    }

    getSpreadsheetId(): string | null {
        return this.spreadsheetId;
    }

    setSpreadsheetId(id: string): void {
        this.spreadsheetId = id;
    }
}