export class SheetService {
    private accessToken: string;
    private spreadsheetId: string | null = null;
    private spreadsheetName: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
        const now = new Date();
        const monthYear = `${now.getMonth() + 1}_${now.getFullYear()}`;
        this.spreadsheetName = `flexBookmark_moneyManager_${monthYear}`;
    }

    private checkAuth() {
        if (!this.accessToken) {
            throw new Error('Authentication required');
        }
    }

    private async makeGoogleSheetsRequest(url: string, options: RequestInit = {}, retryCount = 3): Promise<any> {
        // Add delay to prevent rate limiting (1 second between requests)
        await new Promise(resolve => setTimeout(resolve, 1000));

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
                    const errorText = await response.text();
                    console.error('Google API error:', response.status, response.statusText, errorText);
                    throw new Error(`Google API error: ${response.status} ${response.statusText}`);
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
            // First, try to find existing spreadsheet for current month without creating folders
            const spreadsheetSearchResponse = await this.makeGoogleSheetsRequest(
                `https://www.googleapis.com/drive/v3/files?q=name="${this.spreadsheetName}" and mimeType="application/vnd.google-apps.spreadsheet" and trashed=false`
            );

            if (spreadsheetSearchResponse?.files && spreadsheetSearchResponse.files.length > 0) {
                this.spreadsheetId = spreadsheetSearchResponse.files[0].id;
                console.log('Found existing spreadsheet:', this.spreadsheetId);
                // Check if the spreadsheet has the required sheets, if not, initialize them
                await this.initializeSpreadsheet();
                return this.spreadsheetId;
            }

            // Only create folder structure and spreadsheet if not found
            console.log('No existing spreadsheet found, creating new one...');

            // 1. Find or create FlexBookmark folder
            const flexBookmarkFolderResponse = await this.makeGoogleSheetsRequest(
                'https://www.googleapis.com/drive/v3/files?q=name="FlexBookmark" and mimeType="application/vnd.google-apps.folder" and trashed=false'
            );

            let flexBookmarkFolderId;
            if (!flexBookmarkFolderResponse || !flexBookmarkFolderResponse.files || flexBookmarkFolderResponse.files.length === 0) {
                console.log('Creating FlexBookmark folder...');
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

            // 2. Find or create MoneyManager folder in FlexBookmark
            const moneyManagerFolderResponse = await this.makeGoogleSheetsRequest(
                `https://www.googleapis.com/drive/v3/files?q=name="MoneyManager" and mimeType="application/vnd.google-apps.folder" and trashed=false and "${flexBookmarkFolderId}" in parents`
            );

            let moneyManagerFolderId;
            if (!moneyManagerFolderResponse || !moneyManagerFolderResponse.files || moneyManagerFolderResponse.files.length === 0) {
                console.log('Creating MoneyManager folder...');
                const createFolderResponse = await this.makeGoogleSheetsRequest(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: 'MoneyManager',
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [flexBookmarkFolderId]
                        })
                    }
                );
                moneyManagerFolderId = createFolderResponse.id;
            } else {
                moneyManagerFolderId = moneyManagerFolderResponse.files[0].id;
            }

            // 3. Find or create year folder in MoneyManager
            const currentYear = new Date().getFullYear().toString();
            const yearFolderResponse = await this.makeGoogleSheetsRequest(
                `https://www.googleapis.com/drive/v3/files?q=name="${currentYear}" and mimeType="application/vnd.google-apps.folder" and trashed=false and "${moneyManagerFolderId}" in parents`
            );

            let yearFolderId;
            if (!yearFolderResponse || !yearFolderResponse.files || yearFolderResponse.files.length === 0) {
                console.log('Creating year folder...');
                const createFolderResponse = await this.makeGoogleSheetsRequest(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: currentYear,
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [moneyManagerFolderId]
                        })
                    }
                );
                yearFolderId = createFolderResponse.id;
            } else {
                yearFolderId = yearFolderResponse.files[0].id;
            }

            // 4. Create spreadsheet for current month in year folder
            console.log('Creating new spreadsheet...');
            const createSpreadsheetResponse = await this.makeGoogleSheetsRequest(
                'https://www.googleapis.com/drive/v3/files',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        name: this.spreadsheetName,
                        mimeType: 'application/vnd.google-apps.spreadsheet',
                        parents: [yearFolderId]
                    })
                }
            );

            this.spreadsheetId = createSpreadsheetResponse.id;

            // Initialize spreadsheet with required sheets and headers
            await this.initializeSpreadsheet();

            if (!this.spreadsheetId) {
                throw new Error('Failed to create spreadsheet');
            }
            return this.spreadsheetId;
        } catch (error) {
            console.error('Error setting up Drive:', error);

            // Fallback: Create a simple spreadsheet without folder structure
            try {
                console.log('Attempting fallback spreadsheet creation...');
                const createSpreadsheetResponse = await this.makeGoogleSheetsRequest(
                    'https://www.googleapis.com/drive/v3/files',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: this.spreadsheetName,
                            mimeType: 'application/vnd.google-apps.spreadsheet'
                        })
                    }
                );

                this.spreadsheetId = createSpreadsheetResponse.id;
                await this.initializeSpreadsheet();

                if (!this.spreadsheetId) {
                    throw new Error('Failed to create fallback spreadsheet');
                }
                return this.spreadsheetId;
            } catch (fallbackError) {
                console.error('Fallback spreadsheet creation also failed:', fallbackError);
                throw error; // Re-throw original error
            }
        }
    }

    private async initializeSpreadsheet() {
        if (!this.spreadsheetId) return;

        // Define sheets and their headers
        const sheets = [
            {
                name: 'transactions', headers: [
                    'id', 'type', 'amount', 'currency', 'accountId', 'toAccountId', 'categoryId',
                    'date', 'description', 'tags', 'status', 'createdAt', 'updatedAt',
                    'isRecurring', 'recurringPattern', 'recurringEndDate'
                ]
            },
            {
                name: 'accounts', headers: [
                    'id', 'name', 'type', 'balance', 'currency', 'color', 'icon',
                    'isArchived', 'createdAt', 'updatedAt'
                ]
            },
            {
                name: 'categories', headers: [
                    'id', 'name', 'type', 'parentId', 'color', 'icon',
                    'isDefault', 'isArchived', 'budget', 'budgetPeriod'
                ]
            },
            {
                name: 'budgets', headers: [
                    'id', 'categoryId', 'accountId', 'amount', 'period',
                    'startDate', 'endDate', 'alertsEnabled', 'alertThreshold'
                ]
            },
            {
                name: 'savings_goals', headers: [
                    'id', 'name', 'targetAmount', 'currentAmount', 'targetDate',
                    'color', 'icon', 'isCompleted', 'createdAt', 'updatedAt'
                ]
            },
            {
                name: 'debts', headers: [
                    'id', 'name', 'initialAmount', 'currentAmount', 'interestRate',
                    'dueDate', 'type', 'status', 'createdAt', 'updatedAt'
                ]
            }
        ];

        // Get current spreadsheet to check existing sheets
        const spreadsheetDetails = await this.makeGoogleSheetsRequest(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`
        );

        const existingSheets = spreadsheetDetails.sheets.map((sheet: any) => sheet.properties.title);

        for (const sheet of sheets) {
            if (!existingSheets.includes(sheet.name)) {
                // Add new sheet
                await this.makeGoogleSheetsRequest(
                    `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            requests: [{
                                addSheet: {
                                    properties: {
                                        title: sheet.name
                                    }
                                }
                            }]
                        })
                    }
                );
            }

            // Set headers for the sheet
            await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheet.name}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1?valueInputOption=RAW`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        values: [sheet.headers]
                    })
                }
            );
        }
    }

    async fetchRowsFromSheet(sheetName: string): Promise<any[][]> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            const response = await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A2:Z`
            );

            // Check valid response
            if (!response || !response.values || !Array.isArray(response.values)) {
                console.warn('No data found in spreadsheet or invalid response format:', response);
                return [];
            }

            return response.values;
        } catch (error) {
            console.error('Error fetching rows from sheet:', error);
            // Return empty array instead of throwing error to avoid crash
            return [];
        }
    }

    async appendRow(sheetName: string, row: any[]): Promise<void> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A2:append?valueInputOption=RAW`,
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

    async updateRow(sheetName: string, rowIndex: number, row: any[]): Promise<void> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            // Convert rowIndex to 1-based and add 1 for header row
            const range = `${sheetName}!A${rowIndex + 2}:${String.fromCharCode(65 + row.length - 1)}${rowIndex + 2}`;
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

    async deleteRow(sheetName: string, rowIndex: number): Promise<void> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            // Get the sheet ID for the given sheet name
            const spreadsheetDetails = await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`
            );

            const sheet = spreadsheetDetails.sheets.find((s: any) => s.properties.title === sheetName);
            if (!sheet) {
                throw new Error(`Sheet ${sheetName} not found`);
            }

            const sheetId = sheet.properties.sheetId;

            await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/batchUpdate`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        requests: [{
                            deleteDimension: {
                                range: {
                                    sheetId: sheetId,
                                    dimension: 'ROWS',
                                    startIndex: rowIndex + 1, // +1 for header row
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

    async findRowIndex(sheetName: string, column: string, value: string): Promise<number> {
        this.checkAuth();
        if (!this.spreadsheetId) {
            await this.setupDrive();
        }

        try {
            const response = await this.makeGoogleSheetsRequest(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!${column}2:${column}`
            );

            if (!response.values || !Array.isArray(response.values)) {
                return -1;
            }

            return response.values.findIndex((cellArray: any[]) => {
                const cellValue = cellArray && cellArray.length > 0 ? cellArray[0] : undefined;
                return cellValue === value;
            });
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