/**
 * 🎯 HABIT MANAGEMENT UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🔄 Orchestration layer giữa Drive và Sheets operations
 * ├── 📊 Quản lý toàn bộ vòng đời thói quen
 * ├── 🎯 Đồng bộ dữ liệu giữa memory và Google Sheets
 * ├── 📈 Xử lý logic nghiệp vụ (streaks, tracking)
 * └── 🔧 Cung cấp API thống nhất cho UI layer
 */

import type { Habit } from '../../types/habit';
import { DriveUtils } from './DriveUtils';
import { SheetsUtils } from './SheetsUtils';
import type { DriveFolder, DriveFile, BatchOperation } from '../../types/drive';

export class HabitUtils {
    // 🔐 PRIVATE PROPERTIES
    private driveUtils: DriveUtils;
    private sheetsUtils: SheetsUtils;

    // 🏗️ CONSTRUCTOR
    constructor(accessToken: string) {
        this.driveUtils = new DriveUtils(accessToken);
        this.sheetsUtils = new SheetsUtils(accessToken);
    }

    // 🔄 TOKEN MANAGEMENT

    /**
     * 🔄 Cập nhật access token cho tất cả utilities
     * @param accessToken - Token mới
     */
    updateToken(accessToken: string): void {
        this.driveUtils.updateToken(accessToken);
        this.sheetsUtils.updateToken(accessToken);
    }

    // ========== FOLDER OPERATIONS (Delegated to DriveUtils) ==========

    /**
     * 🔍 Kiểm tra thư mục HabitTracker có tồn tại
     * @returns {Promise<DriveFolder | null>} Thư mục hoặc null
     */
    async checkFolderExists(): Promise<DriveFolder | null> {
        return this.driveUtils.checkFolderExists();
    }

    /**
     * 📂 Tạo thư mục HabitTracker mới
     * @returns {Promise<DriveFolder>} Thông tin thư mục đã tạo
     */
    async createFolder(): Promise<DriveFolder> {
        return this.driveUtils.createFolder();
    }

    /**
     * ✅ Đảm bảo thư mục HabitTracker tồn tại
     * @returns {Promise<DriveFolder>} Thư mục đảm bảo tồn tại
     */
    async ensureFolderExists(): Promise<DriveFolder> {
        return this.driveUtils.ensureFolderExists();
    }

    /**
     * 🗑️ Xóa thư mục HabitTracker và tất cả nội dung
     * @returns {Promise<void>}
     */
    async deleteFolder(): Promise<void> {
        return this.driveUtils.deleteFolder();
    }

    // ========== SHEET FILE OPERATIONS (Delegated to DriveUtils) ==========

    /**
     * 🔍 Kiểm tra file spreadsheet tồn tại trong thư mục
     * @param folderId - ID thư mục cha
     * @returns {Promise<DriveFile | null>} File hoặc null
     */
    async checkSheetExists(folderId: string): Promise<DriveFile | null> {
        return this.driveUtils.checkSheetExists(folderId);
    }

    /**
     * 📊 Tạo spreadsheet theo dõi thói quen mới
     * @param folderId - ID thư mục cha
     * @returns {Promise<DriveFile>} Thông tin file đã tạo
     */
    async createSheet(folderId: string): Promise<DriveFile> {
        const sheetFile = await this.driveUtils.createSheet(folderId);

        // 🏗️ Khởi tạo headers sau khi tạo
        await this.sheetsUtils.initializeSheetHeaders(sheetFile.id);

        return sheetFile;
    }

    /**
     * ✅ Đảm bảo file spreadsheet tồn tại
     * @returns {Promise<DriveFile>} File đảm bảo tồn tại
     */
    async ensureSheetExists(): Promise<DriveFile> {
        return this.driveUtils.ensureSheetExists();
    }

    /**
     * 🗑️ Xóa file spreadsheet
     * @param sheetId - ID file cần xóa
     * @returns {Promise<void>}
     */
    async deleteSheet(sheetId: string): Promise<void> {
        return this.driveUtils.deleteSheet(sheetId);
    }

    // ========== SHEET CONTENT OPERATIONS (Delegated to SheetsUtils) ==========

    /**
     * 🏗️ Khởi tạo sheet với headers
     * @param sheetId - ID sheet cần khởi tạo
     * @returns {Promise<void>}
     */
    async initializeSheetHeaders(sheetId: string): Promise<void> {
        return this.sheetsUtils.initializeSheetHeaders(sheetId);
    }

    /**
     * 📖 Đọc tất cả thói quen từ sheet
     * @param sheetId - ID sheet cần đọc
     * @returns {Promise<Habit[]>} Danh sách thói quen
     */
    async readAllHabits(sheetId: string): Promise<Habit[]> {
        return this.sheetsUtils.readAllHabits(sheetId);
    }

    /**
     * 📝 Ghi thói quen vào sheet (create hoặc update)
     * @param sheetId - ID sheet đích
     * @param habit - Thói quen cần ghi
     * @param rowIndex - Index hàng (optional cho update)
     * @returns {Promise<void>}
     */
    async writeHabit(sheetId: string, habit: Habit, rowIndex?: number): Promise<void> {
        return this.sheetsUtils.writeHabit(sheetId, habit, rowIndex);
    }

    /**
     * 🗑️ Xóa thói quen từ sheet
     * @param sheetId - ID sheet
     * @param habitId - ID thói quen cần xóa
     * @returns {Promise<void>}
     */
    async deleteHabit(sheetId: string, habitId: string): Promise<void> {
        return this.sheetsUtils.deleteHabit(sheetId, habitId);
    }

    /**
     * 🔄 Cập nhật giá trị cell cụ thể (cho daily tracking)
     * @param sheetId - ID sheet
     * @param habitId - ID thói quen
     * @param columnName - Tên cột
     * @param value - Giá trị mới
     * @returns {Promise<void>}
     */
    async updateCellValue(
        sheetId: string,
        habitId: string,
        columnName: string,
        value: any
    ): Promise<void> {
        return this.sheetsUtils.updateCellValue(sheetId, habitId, columnName, value);
    }

    /**
     * 📅 Cập nhật giá trị thói quen hàng ngày và tính lại streaks
     * @param sheetId - ID sheet
     * @param habitId - ID thói quen
     * @param day - Ngày trong tháng (1-31)
     * @param value - Giá trị tracking
     * @returns {Promise<Habit | null>} Thói quen đã cập nhật hoặc null
     */
    async updateDailyHabit(sheetId: string, habitId: string, day: number, value: number): Promise<Habit | null> {
        return this.sheetsUtils.updateDailyHabit(sheetId, habitId, day, value);
    }

    /**
     * 📦 Batch update nhiều thói quen
     * @param sheetId - ID sheet
     * @param operations - Danh sách operations
     * @returns {Promise<void>}
     */
    async batchUpdateHabits(sheetId: string, operations: BatchOperation[]): Promise<void> {
        return this.sheetsUtils.batchUpdateHabits(sheetId, operations);
    }
}