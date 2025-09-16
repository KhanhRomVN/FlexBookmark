// src/presentation/tab/MoneyManager/services/sheetService.ts
interface FolderSearchResponse {
    files: Array<{
        id: string;
        name: string;
    }>;
}

interface CachedData {
    data: any[];
    timestamp: number;
}

export class SheetService {
    private accessToken: string;
    private spreadsheetId: string | null = null;
    private spreadsheetName: string;
    private sheetDataCache = new Map<string, CachedData>();
    private CACHE_EXPIRY = 30000; // 30 seconds
    private requestQueue: Promise<any> = Promise.resolve();
    private retryDelays = [1000, 2000, 4000]; // Exponential backoff delays

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
        // Queue requests to prevent rate limiting
        return this.requestQueue = this.requestQueue.then(async () => {
            // Add delay to prevent rate limiting (500ms between requests)
            await new Promise(resolve => setTimeout(resolve, 500));

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
                        const backoffTime = this.retryDelays[i] || 8000;
                        console.warn(`Rate limited. Retrying in ${backoffTime}ms...`);
                        await new Promise(resolve => setTimeout(resolve, backoffTime));
                        continue;
                    }

                    if (response.status === 401) {
                        throw new Error('Authentication expired. Please sign in again.');
                    }

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Google API error:', response.status, response.statusText, errorText);

                        if (response.status === 404) {
                            // Sheet doesn't exist, we'll create it
                            throw new Error(`Sheet not found: ${url}`);
                        }

                        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
                    }

                    return response.json();
                } catch (error) {
                    if (i === retryCount - 1) throw error;

                    // Exponential backoff for other errors
                    const backoffTime = this.retryDelays[i] || 8000;
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        });
    }

    // Clear cache for specific sheet or all sheets
    private clearCache(sheetName?: string) {
        if (sheetName) {
            this.sheetDataCache.delete(sheetName);
        } else {
            this.sheetDataCache.clear();
        }
    }

    // Modified setupDrive method with retry logic and proper typing
    async setupDrive(): Promise<string> {
        this.checkAuth();

        try {
            // First, try to find existing spreadsheet for current month
            const spreadsheetSearchResponse = await this.makeGoogleSheetsRequest(
                `https://www.googleapis.com/drive/v3/files?q=name="${this.spreadsheetName}" and mimeType="application/vnd.google-apps.spreadsheet" and trashed=false`
            ) as FolderSearchResponse;

            if (spreadsheetSearchResponse?.files?.length > 0) {
                this.spreadsheetId = spreadsheetSearchResponse.files[0].id;
                console.log('Found existing spreadsheet:', this.spreadsheetId);
                await this.initializeSpreadsheet();
                return this.spreadsheetId;
            }

            console.log('No existing spreadsheet found, creating new one...');

            // Create spreadsheet directly without complex folder structure
            console.log('Creating new spreadsheet...');
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
                throw new Error('Failed to create spreadsheet');
            }
            return this.spreadsheetId;
        } catch (error) {
            console.error('Error setting up Drive:', error);
            throw error;
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
                    'description', // ADDED: description field to accounts sheet headers
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
        try {
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
                try {
                    await this.makeGoogleSheetsRequest(
                        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheet.name}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1?valueInputOption=RAW`,
                        {
                            method: 'PUT',
                            body: JSON.stringify({
                                values: [sheet.headers]
                            })
                        }
                    );
                } catch (error) {
                    console.warn(`Failed to set headers for ${sheet.name}:`, error);
                    // Continue with other sheets
                }
            }
        } catch (error) {
            console.error('Error initializing spreadsheet:', error);
            // We'll continue even if initialization fails partially
        }
    }

    async fetchRowsFromSheet(sheetName: string): Promise<any[][]> {
        this.checkAuth();

        // Check cache first
        const cached = this.sheetDataCache.get(sheetName);
        if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
            console.log(`Using cached data for sheet: ${sheetName}`);
            return cached.data;
        }

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
                // Cache empty result to avoid repeated API calls
                this.sheetDataCache.set(sheetName, {
                    data: [],
                    timestamp: Date.now()
                });
                return [];
            }

            // Cache the result
            this.sheetDataCache.set(sheetName, {
                data: response.values,
                timestamp: Date.now()
            });

            console.log(`Fetched and cached ${response.values.length} rows for sheet: ${sheetName}`);
            return response.values;
        } catch (error) {
            console.error('Error fetching rows from sheet:', error);
            // Return cached data if available, even if expired
            if (cached) {
                console.log(`Using expired cached data for sheet: ${sheetName}`);
                return cached.data;
            }
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

            // Clear cache for this sheet to ensure fresh data on next fetch
            this.clearCache(sheetName);
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

            // Clear cache for this sheet to ensure fresh data on next fetch
            this.clearCache(sheetName);
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

            // Clear cache for this sheet to ensure fresh data on next fetch
            this.clearCache(sheetName);
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

    // Method to clear all caches
    clearAllCaches(): void {
        this.clearCache();
    }

    // Method to get cache status
    getCacheStatus(): { [key: string]: { age: number; size: number } } {
        const status: { [key: string]: { age: number; size: number } } = {};
        const now = Date.now();

        this.sheetDataCache.forEach((value, key) => {
            status[key] = {
                age: now - value.timestamp,
                size: value.data.length
            };
        });

        return status;
    }
}