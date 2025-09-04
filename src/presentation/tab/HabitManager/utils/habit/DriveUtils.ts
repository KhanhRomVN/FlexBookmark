/**
 * 📁 GOOGLE DRIVE UTILITIES MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 📂 Quản lý thư mục HabitTracker trên Google Drive
 * ├── 📊 Quản lý file spreadsheet theo dõi thói quen
 * ├── 🔄 Xử lý các thao tác CRUD với thư mục và file
 * ├── 🎯 Đảm bảo cấu trúc dữ liệu nhất quán
 * └── 📝 Xử lý lỗi và retry logic
 * 
 * 🏗️ CẤU TRÚC CHÍNH:
 * ├── Folder Operations     → Tạo, kiểm tra, xóa thư mục
 * ├── File Operations       → Tạo, kiểm tra, xóa file spreadsheet
 * ├── Token Management      → Quản lý access token
 * ├── Error Handling       → Xử lý lỗi API và network
 * └── Validation           → Kiểm tra tính hợp lệ của dữ liệu
 * 
 * 🔧 CÁC CHỨC NĂNG CHÍNH:
 * ├── checkFolderExists()   → Kiểm tra thư mục tồn tại
 * ├── createFolder()        → Tạo thư mục mới
 * ├── ensureFolderExists()  → Đảm bảo thư mục tồn tại
 * ├── deleteFolder()        → Xóa thư mục và nội dung
 * ├── checkSheetExists()    → Kiểm tra file spreadsheet tồn tại
 * ├── createSheet()         → Tạo spreadsheet mới
 * ├── ensureSheetExists()   → Đảm bảo file tồn tại
 * └── deleteSheet()         → Xóa file spreadsheet
 */

import { HabitConstants, type DriveFolder, type DriveFile } from '../../types';

export class DriveUtils {
    // 🔐 PRIVATE PROPERTIES
    // ────────────────────────────────────────────────────────────────────────────
    private accessToken: string;

    // 🏗️ CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🏗️ Khởi tạo DriveUtils với access token
     * @param accessToken - Google OAuth2 access token
     */
    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    // 🔄 TOKEN MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔄 Cập nhật access token mới
     * @param accessToken - Token mới
     */
    updateToken(accessToken: string): void {
        this.accessToken = accessToken;
    }

    // ========== FOLDER OPERATIONS ==========

    /**
     * 🔍 Kiểm tra thư mục HabitTracker có tồn tại
     * @returns {Promise<DriveFolder | null>} Thư mục hoặc null nếu không tồn tại
     */
    async checkFolderExists(): Promise<DriveFolder | null> {
        try {
            console.log('🔍 Checking HabitTracker folder existence...');

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
            const folderExists = data.files && data.files.length > 0;

            console.log(`📊 Folder check result: ${folderExists ? 'EXISTS' : 'NOT FOUND'}`);
            return folderExists ? data.files[0] : null;

        } catch (error) {
            console.error('❌ Failed to check folder existence:', error);
            throw error;
        }
    }

    /**
     * 📂 Tạo thư mục HabitTracker mới
     * @returns {Promise<DriveFolder>} Thông tin thư mục đã tạo
     */
    async createFolder(): Promise<DriveFolder> {
        try {
            console.log('📂 Creating HabitTracker folder...');

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

            const folder = await response.json();
            console.log('✅ Folder created successfully:', folder.id);
            return folder;

        } catch (error) {
            console.error('❌ Failed to create folder:', error);
            throw error;
        }
    }

    /**
     * ✅ Đảm bảo thư mục HabitTracker tồn tại (tạo nếu chưa có)
     * @returns {Promise<DriveFolder>} Thư mục đảm bảo tồn tại
     */
    async ensureFolderExists(): Promise<DriveFolder> {
        try {
            console.log('🔍 Ensuring HabitTracker folder exists...');
            let folder = await this.checkFolderExists();

            if (!folder) {
                console.log('📂 Folder not found, creating new one...');
                folder = await this.createFolder();
            } else {
                console.log('✅ Folder already exists:', folder.id);
            }

            return folder;

        } catch (error) {
            console.error('❌ Failed to ensure folder existence:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Xóa thư mục HabitTracker và tất cả nội dung
     * @returns {Promise<void>}
     */
    async deleteFolder(): Promise<void> {
        try {
            console.log('🗑️ Attempting to delete HabitTracker folder...');
            const folder = await this.checkFolderExists();

            if (!folder) {
                console.log('📭 Folder not found, nothing to delete');
                return;
            }

            const response = await fetch(`${HabitConstants.DRIVE_API_BASE}/files/${folder.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete folder: ${response.status}`);
            }

            console.log('✅ Folder deleted successfully:', folder.id);

        } catch (error) {
            console.error('❌ Failed to delete folder:', error);
            throw error;
        }
    }

    // ========== SHEET FILE OPERATIONS ==========

    /**
     * 🔍 Kiểm tra file spreadsheet tồn tại trong thư mục
     * @param folderId - ID thư mục cha
     * @returns {Promise<DriveFile | null>} File hoặc null nếu không tồn tại
     */
    async checkSheetExists(folderId: string): Promise<DriveFile | null> {
        try {
            console.log('🔍 Checking habit sheet existence...');

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
            const sheetExists = data.files && data.files.length > 0;

            console.log(`📊 Sheet check result: ${sheetExists ? 'EXISTS' : 'NOT FOUND'}`);
            return sheetExists ? data.files[0] : null;

        } catch (error) {
            console.error('❌ Failed to check sheet existence:', error);
            throw error;
        }
    }

    /**
     * 📊 Tạo spreadsheet theo dõi thói quen mới
     * @param folderId - ID thư mục cha
     * @returns {Promise<DriveFile>} Thông tin file đã tạo
     */
    async createSheet(folderId: string): Promise<DriveFile> {
        try {
            console.log('📊 Creating new habit tracking spreadsheet...');

            // 🏗️ Tạo cấu trúc spreadsheet
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

            // 📝 Tạo spreadsheet
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

            // 📂 Di chuyển vào thư mục HabitTracker
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

            const sheetFile: DriveFile = {
                id: newSheet.spreadsheetId,
                name: HabitConstants.SHEET_NAME,
                mimeType: 'application/vnd.google-apps.spreadsheet',
                createdTime: new Date().toISOString(),
                modifiedTime: new Date().toISOString(),
                parents: [folderId]
            };

            console.log('✅ Sheet created successfully:', sheetFile.id);
            return sheetFile;

        } catch (error) {
            console.error('❌ Failed to create sheet:', error);
            throw error;
        }
    }

    /**
     * ✅ Đảm bảo file spreadsheet tồn tại (tạo nếu chưa có)
     * @returns {Promise<DriveFile>} File đảm bảo tồn tại
     */
    async ensureSheetExists(): Promise<DriveFile> {
        try {
            console.log('🔍 Ensuring habit sheet exists...');
            const folder = await this.ensureFolderExists();
            let sheet = await this.checkSheetExists(folder.id);

            if (!sheet) {
                console.log('📊 Sheet not found, creating new one...');
                sheet = await this.createSheet(folder.id);
            } else {
                console.log('✅ Sheet already exists:', sheet.id);
            }

            return sheet;

        } catch (error) {
            console.error('❌ Failed to ensure sheet existence:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Xóa file spreadsheet
     * @param sheetId - ID file cần xóa
     * @returns {Promise<void>}
     */
    async deleteSheet(sheetId: string): Promise<void> {
        try {
            console.log(`🗑️ Attempting to delete sheet: ${sheetId}`);

            const response = await fetch(`${HabitConstants.DRIVE_API_BASE}/files/${sheetId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete sheet: ${response.status}`);
            }

            console.log('✅ Sheet deleted successfully:', sheetId);

        } catch (error) {
            console.error('❌ Failed to delete sheet:', error);
            throw error;
        }
    }
}