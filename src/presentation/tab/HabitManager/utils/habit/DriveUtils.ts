import { HabitConstants, type DriveFolder, type DriveFile } from '../../types/drive';

export class DriveUtils {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    /**
     * Update access token
     */
    updateToken(accessToken: string): void {
        this.accessToken = accessToken;
    }

    // ========== FOLDER OPERATIONS ==========

    /**
     * Check if HabitTracker folder exists
     */
    async checkFolderExists(): Promise<DriveFolder | null> {
        try {
            const response = await fetch(
                `${HabitConstants.DRIVE_API_BASE}/files?q=name='${HabitConstants.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Drive API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.files && data.files.length > 0 ? data.files[0] : null;
        } catch (error) {
            console.error('Failed to check folder existence:', error);
            throw error;
        }
    }

    /**
     * Create HabitTracker folder
     */
    async createFolder(): Promise<DriveFolder> {
        try {
            const folderMetadata = {
                name: HabitConstants.FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            };

            const response = await fetch(`${HabitConstants.DRIVE_API_BASE}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(folderMetadata)
            });

            if (!response.ok) {
                throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to create folder:', error);
            throw error;
        }
    }

    /**
     * Get or create HabitTracker folder
     */
    async ensureFolderExists(): Promise<DriveFolder> {
        let folder = await this.checkFolderExists();

        if (!folder) {
            console.log('Creating HabitTracker folder...');
            folder = await this.createFolder();
        }

        return folder;
    }

    /**
     * Delete HabitTracker folder and all contents
     */
    async deleteFolder(): Promise<void> {
        const folder = await this.checkFolderExists();
        if (!folder) return;

        try {
            const response = await fetch(`${HabitConstants.DRIVE_API_BASE}/files/${folder.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete folder: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to delete folder:', error);
            throw error;
        }
    }

    // ========== SHEET FILE OPERATIONS ==========

    /**
     * Check if habit sheet exists in folder
     */
    async checkSheetExists(folderId: string): Promise<DriveFile | null> {
        try {
            const response = await fetch(
                `${HabitConstants.DRIVE_API_BASE}/files?q=name='${HabitConstants.SHEET_NAME}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Drive API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.files && data.files.length > 0 ? data.files[0] : null;
        } catch (error) {
            console.error('Failed to check sheet existence:', error);
            throw error;
        }
    }

    /**
     * Create new habit tracking spreadsheet
     */
    async createSheet(folderId: string): Promise<DriveFile> {
        try {
            // First create the spreadsheet
            const spreadsheetData = {
                properties: {
                    title: HabitConstants.SHEET_NAME
                },
                sheets: [{
                    properties: {
                        title: 'Habits',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: HabitConstants.SHEET_HEADERS.length
                        }
                    }
                }]
            };

            const createResponse = await fetch(HabitConstants.SHEETS_API_BASE, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(spreadsheetData)
            });

            if (!createResponse.ok) {
                throw new Error(`Failed to create spreadsheet: ${createResponse.status}`);
            }

            const newSheet = await createResponse.json();

            // Move to HabitTracker folder
            await fetch(`${HabitConstants.DRIVE_API_BASE}/files/${newSheet.spreadsheetId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parents: [folderId]
                })
            });

            return {
                id: newSheet.spreadsheetId,
                name: HabitConstants.SHEET_NAME,
                mimeType: 'application/vnd.google-apps.spreadsheet',
                createdTime: new Date().toISOString(),
                modifiedTime: new Date().toISOString(),
                parents: [folderId]
            };
        } catch (error) {
            console.error('Failed to create sheet:', error);
            throw error;
        }
    }

    /**
     * Get or create habit tracking sheet
     */
    async ensureSheetExists(): Promise<DriveFile> {
        const folder = await this.ensureFolderExists();
        let sheet = await this.checkSheetExists(folder.id);

        if (!sheet) {
            console.log('Creating habit tracking sheet...');
            sheet = await this.createSheet(folder.id);
        }

        return sheet;
    }

    /**
     * Delete habit tracking sheet
     */
    async deleteSheet(sheetId: string): Promise<void> {
        try {
            const response = await fetch(`${HabitConstants.DRIVE_API_BASE}/files/${sheetId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete sheet: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to delete sheet:', error);
            throw error;
        }
    }
}