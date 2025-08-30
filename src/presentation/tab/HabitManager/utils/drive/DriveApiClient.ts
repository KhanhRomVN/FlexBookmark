export class DriveApiClient {
    private baseApiUrl = 'https://www.googleapis.com/drive/v3';
    private sheetsApiUrl = 'https://sheets.googleapis.com/v4';

    constructor(private accessToken: string) { }

    updateToken(newToken: string): void {
        this.accessToken = newToken;
    }

    async createFolder(name: string, parentId: string): Promise<{ id: string; name: string }> {
        const folderMetadata = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };

        const response = await this.makeRequest(`${this.baseApiUrl}/files`, {
            method: 'POST',
            body: JSON.stringify(folderMetadata)
        });

        if (!response.ok) {
            throw new Error(`Failed to create folder "${name}": ${response.status}`);
        }

        return response.json();
    }

    async findFolder(name: string, parentId: string): Promise<{ id: string; name: string } | null> {
        const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const response = await this.makeRequest(
            `${this.baseApiUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,parents)`
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    }

    async findFile(name: string, parentId: string): Promise<{ id: string; name: string } | null> {
        const query = `name='${name}' and '${parentId}' in parents and trashed=false`;
        const response = await this.makeRequest(
            `${this.baseApiUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,parents)`
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    }

    async createSpreadsheet(name: string, parentId: string): Promise<string> {
        const sheetMetadata = {
            name,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [parentId]
        };

        const response = await this.makeRequest(`${this.baseApiUrl}/files`, {
            method: 'POST',
            body: JSON.stringify(sheetMetadata)
        });

        if (!response.ok) {
            throw new Error(`Failed to create sheet: ${response.status}`);
        }

        const sheet = await response.json();
        return sheet.id;
    }

    async updateSheetRange(sheetId: string, range: string, values: any[][]): Promise<void> {
        const response = await this.makeRequest(
            `${this.sheetsApiUrl}/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`,
            {
                method: 'PUT',
                body: JSON.stringify({ values })
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to update range ${range}: ${response.status}`);
        }
    }

    async readSheetRange(sheetId: string, range: string): Promise<any[][]> {
        const response = await this.makeRequest(
            `${this.sheetsApiUrl}/spreadsheets/${sheetId}/values/${range}`
        );

        if (!response.ok) {
            if (response.status === 400) return [];
            throw new Error(`Failed to read range ${range}: ${response.status}`);
        }

        const data = await response.json();
        return data.values || [];
    }

    async batchUpdateSheet(sheetId: string, requests: any[]): Promise<void> {
        const response = await this.makeRequest(
            `${this.sheetsApiUrl}/spreadsheets/${sheetId}:batchUpdate`,
            {
                method: 'POST',
                body: JSON.stringify({ requests })
            }
        );

        if (!response.ok) {
            throw new Error(`Batch update failed: ${response.status}`);
        }
    }

    private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
        return fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
}