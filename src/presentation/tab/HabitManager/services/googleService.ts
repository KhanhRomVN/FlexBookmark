import type { DriveFile, DriveFolder } from '../types';

export class GoogleService {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    /**
     * 🔄 Update access token
     */
    updateAccessToken(token: string): void {
        this.accessToken = token;
    }

    // ========== DRIVE OPERATIONS ==========

    /**
     * 🔍 Search for files in Google Drive
     */
    async searchFiles(query: string): Promise<DriveFile[]> {
        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('❌ File search failed:', error);
            throw error;
        }
    }

    /**
     * 📂 Create folder in Google Drive
     */
    async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
        try {
            const folderMetadata: any = {
                name,
                mimeType: 'application/vnd.google-apps.folder'
            };

            if (parentId) {
                folderMetadata.parents = [parentId];
            }

            const response = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(folderMetadata)
            });

            if (!response.ok) {
                throw new Error(`Folder creation failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Folder creation failed:', error);
            throw error;
        }
    }

    /**
     * 📄 Create file in Google Drive
     */
    async createFile(name: string, mimeType: string, content: any, parentId?: string): Promise<DriveFile> {
        try {
            const fileMetadata: any = {
                name,
                mimeType
            };

            if (parentId) {
                fileMetadata.parents = [parentId];
            }

            const response = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fileMetadata)
            });

            if (!response.ok) {
                throw new Error(`File creation failed: ${response.status}`);
            }

            const file = await response.json();

            // If content is provided, update the file
            if (content) {
                await this.updateFileContent(file.id, content, mimeType);
            }

            return file;
        } catch (error) {
            console.error('❌ File creation failed:', error);
            throw error;
        }
    }

    /**
     * ✏️ Update file content
     */
    async updateFileContent(fileId: string, content: any, mimeType: string): Promise<void> {
        try {
            let body: any;
            let contentType: string;

            if (mimeType === 'application/vnd.google-apps.spreadsheet') {
                // For Sheets, we use the Sheets API instead
                return;
            } else {
                body = JSON.stringify(content);
                contentType = 'application/json';
            }

            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': contentType
                },
                body
            });

            if (!response.ok) {
                throw new Error(`File update failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ File update failed:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Delete file from Google Drive
     */
    async deleteFile(fileId: string): Promise<void> {
        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`File deletion failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ File deletion failed:', error);
            throw error;
        }
    }

    // ========== SHEETS OPERATIONS ==========

    /**
     * 📊 Create new spreadsheet
     */
    async createSpreadsheet(title: string, parentId?: string): Promise<any> {
        try {
            const spreadsheetData = {
                properties: {
                    title
                },
                sheets: [{
                    properties: {
                        title: 'Sheet1',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 26
                        }
                    }
                }]
            };

            const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(spreadsheetData)
            });

            if (!response.ok) {
                throw new Error(`Spreadsheet creation failed: ${response.status}`);
            }

            const spreadsheet = await response.json();

            // Move to folder if parentId provided
            if (parentId) {
                await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheet.spreadsheetId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        parents: [parentId]
                    })
                });
            }

            return spreadsheet;
        } catch (error) {
            console.error('❌ Spreadsheet creation failed:', error);
            throw error;
        }
    }

    /**
     * 📝 Update spreadsheet values
     */
    async updateSpreadsheetValues(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ values })
                }
            );

            if (!response.ok) {
                throw new Error(`Spreadsheet update failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Spreadsheet update failed:', error);
            throw error;
        }
    }

    /**
     * 📖 Read spreadsheet values
     */
    async readSpreadsheetValues(spreadsheetId: string, range: string): Promise<any[][]> {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Spreadsheet read failed: ${response.status}`);
            }

            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('❌ Spreadsheet read failed:', error);
            throw error;
        }
    }

    /**
     * 🎨 Format spreadsheet
     */
    async formatSpreadsheet(spreadsheetId: string, requests: any[]): Promise<void> {
        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
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
                throw new Error(`Spreadsheet format failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Spreadsheet format failed:', error);
            throw error;
        }
    }

    // ========== UTILITY METHODS ==========

    /**
     * ⚡ Test Google API connectivity
     */
    async testConnectivity(): Promise<boolean> {
        try {
            const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * 📊 Get API usage quota
     */
    async getQuotaUsage(): Promise<{ usage: number; limit: number }> {
        // This is a simplified implementation
        // Actual quota usage would come from Google Cloud Console
        return { usage: 0, limit: 1000 };
    }
}

export default GoogleService;