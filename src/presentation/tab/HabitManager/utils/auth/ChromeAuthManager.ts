/**
 * 🔐 CHROME AUTHENTICATION MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🎯 Quản lý authentication với Chrome Identity API
 * ├── 🔄 Xử lý OAuth2 flow và token management
 * ├── 📊 Theo dõi authentication state changes
 * ├── 🧪 Token validation và scope checking
 * └── 🔧 Error handling và recovery
 */

import { AuthUtils } from './AuthUtils';
import { AuthErrorUtils } from './AuthErrorUtils';
import type {
    AuthState,
    AuthUser,
    TokenValidationResult,
    PermissionCheckResult,
    AuthOperationResult
} from '../../types/auth';

// ⚙️ SERVICE SCOPES CONFIGURATION
const SERVICE_SCOPES = {
    CORE: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
    DRIVE: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ],
    SHEETS: [
        'https://www.googleapis.com/auth/spreadsheets'
    ],
    CALENDAR: [
        'https://www.googleapis.com/auth/calendar.events.readonly'
    ]
} as const;

export class ChromeAuthManager {
    // 🔧 SINGLETON PATTERN
    private static instance: ChromeAuthManager;
    private authState: AuthState;
    private subscribers: Array<(state: AuthState) => void> = [];

    // 🏗️ PRIVATE CONSTRUCTOR
    private constructor() {
        this.authState = {
            isAuthenticated: false,
            user: null,
            loading: true,
            error: null
        };
    }

    /**
     * 🏭 Lấy instance duy nhất của ChromeAuthManager
     * @returns {ChromeAuthManager} Singleton instance
     */
    static getInstance(): ChromeAuthManager {
        if (!ChromeAuthManager.instance) {
            ChromeAuthManager.instance = new ChromeAuthManager();
        }
        return ChromeAuthManager.instance;
    }

    // ========== CORE AUTH OPERATIONS ==========

    /**
     * 🚀 Khởi tạo authentication manager
     * @returns {Promise<void>}
     */
    async initialize(): Promise<void> {
        try {
            this.updateState({ loading: true, error: null });

            // 🔍 Kiểm tra Chrome Identity API availability
            if (!chrome.identity) {
                throw new Error('Chrome Identity API is not available');
            }

            // 📊 Lấy token hiện tại (nếu có)
            const token = await this.getToken(false);

            if (token) {
                // ✅ Đã authenticated, lấy user info
                const userInfo = await AuthUtils.getUserInfo(token);
                const user: AuthUser = {
                    id: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    accessToken: token
                };

                this.updateState({
                    isAuthenticated: true,
                    user,
                    loading: false,
                    error: null
                });
            } else {
                // ❌ Chưa authenticated
                this.updateState({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: null
                });
            }

        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Initialization failed'
            });
        }
    }

    /**
     * 🔐 Đăng nhập interactive
     * @returns {Promise<boolean>} True nếu thành công
     */
    async login(): Promise<boolean> {
        try {
            this.updateState({ loading: true, error: null });

            const allScopes = [
                ...SERVICE_SCOPES.CORE,
                ...SERVICE_SCOPES.DRIVE,
                ...SERVICE_SCOPES.SHEETS
            ];

            const token = await this.getToken(true, allScopes);

            if (!token) {
                throw new Error('No token received after login');
            }

            // 📊 Lấy user info
            const userInfo = await AuthUtils.getUserInfo(token);
            const user: AuthUser = {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                accessToken: token
            };

            this.updateState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null
            });

            return true;

        } catch (error) {
            console.error('❌ Login failed:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Login failed'
            });
            return false;
        }
    }

    /**
     * 🚪 Đăng xuất
     * @returns {Promise<void>}
     */
    async logout(): Promise<void> {
        try {
            this.updateState({ loading: true });

            if (this.authState.user?.accessToken) {
                // 🚫 Revoke token hiện tại
                await AuthUtils.revokeToken(this.authState.user.accessToken);
            }

            // 🧹 Xóa cached token
            chrome.identity.removeCachedAuthToken({
                token: this.authState.user?.accessToken || ''
            });

            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });

        } catch (error) {
            console.error('❌ Logout failed:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Logout failed'
            });
        }
    }

    /**
     * 🔄 Buộc đăng nhập lại (force reauthentication)
     * @returns {Promise<boolean>} True nếu thành công
     */
    async forceReauth(): Promise<boolean> {
        try {
            this.updateState({ loading: true, error: null });

            // 🧹 Xóa cached token trước
            if (this.authState.user?.accessToken) {
                chrome.identity.removeCachedAuthToken({
                    token: this.authState.user.accessToken
                });
            }

            // 🔐 Login lại với interactive mode
            return await this.login();

        } catch (error) {
            console.error('❌ Force reauth failed:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Reauth failed'
            });
            return false;
        }
    }

    // ========== TOKEN MANAGEMENT ==========

    /**
     * 🔑 Lấy access token
     * @param interactive - Có hiển thị UI không
     * @param scopes - Scopes cần request
     * @returns {Promise<string | null>} Token hoặc null
     */
    private async getToken(interactive: boolean, scopes?: string[]): Promise<string | null> {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken(
                {
                    interactive,
                    scopes: scopes || [
                        ...SERVICE_SCOPES.CORE,
                        ...SERVICE_SCOPES.DRIVE,
                        ...SERVICE_SCOPES.SHEETS
                    ]
                },
                (token) => {
                    if (chrome.runtime.lastError) {
                        console.warn('⚠️ Token acquisition failed:', chrome.runtime.lastError);
                        resolve(null);
                    } else {
                        resolve(token || null);
                    }
                }
            );
        });
    }

    /**
     * 🔄 Cập nhật access token
     * @param newToken - Token mới
     * @returns {Promise<void>}
     */
    async updateToken(newToken: string): Promise<void> {
        if (this.authState.user) {
            const updatedUser: AuthUser = {
                ...this.authState.user,
                accessToken: newToken
            };

            this.updateState({
                user: updatedUser
            });
        }
    }

    // ========== VALIDATION & PERMISSIONS ==========

    /**
     * 🔍 Validate access token
     * @param token - Token cần validate
     * @returns {Promise<TokenValidationResult>} Kết quả validation
     */
    async validateToken(token: string): Promise<TokenValidationResult> {
        return AuthUtils.validateToken(token);
    }

    /**
     * 📋 Kiểm tra permissions
     * @param token - Access token
     * @param scopes - Scopes cần kiểm tra
     * @returns {Promise<PermissionCheckResult>} Kết quả permission check
     */
    async checkPermissions(token: string, scopes: string[]): Promise<PermissionCheckResult> {
        const scopeTests = await AuthUtils.testAllScopes(token);

        const requiredScopes = [
            ...SERVICE_SCOPES.DRIVE,
            ...SERVICE_SCOPES.SHEETS
        ];

        const hasRequiredScopes = requiredScopes.every(scope =>
            scopeTests[AuthUtils.getScopeNameFromUrl(scope)] || false
        );

        return {
            hasRequiredScopes,
            hasDriveAccess: scopeTests.drive || false,
            hasSheetsAccess: scopeTests.sheets || false,
            hasCalendarAccess: scopeTests.calendar || false,
            scopeDetails: [],
            grantedScopes: [],
            missingScopes: []
        };
    }

    /**
     * 🔍 Kiểm tra có scope cụ thể không
     * @param scope - Scope cần kiểm tra
     * @returns {boolean} True nếu có scope
     */
    hasScope(scope: string): boolean {
        if (!this.authState.user?.accessToken) return false;

        // 📊 Simple check - in production, this should validate with the token
        const allScopes = [
            ...SERVICE_SCOPES.CORE,
            ...SERVICE_SCOPES.DRIVE,
            ...SERVICE_SCOPES.SHEETS,
            ...SERVICE_SCOPES.CALENDAR
        ];

        return allScopes.includes(scope);
    }

    // ========== STATE MANAGEMENT ==========

    /**
     * 🔄 Cập nhật auth state
     * @private
     * @param updates - Phần state cần cập nhật
     */
    private updateState(updates: Partial<AuthState>): void {
        this.authState = { ...this.authState, ...updates };
        this.notifySubscribers();
    }

    /**
     * 📡 Thông báo state changes cho subscribers
     * @private
     */
    private notifySubscribers(): void {
        this.subscribers.forEach(callback => callback(this.authState));
    }

    /**
     * 📋 Subscribe để nhận state changes
     * @param callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback: (state: AuthState) => void): () => void {
        this.subscribers.push(callback);

        // 📞 Gọi callback ngay lập tức với state hiện tại
        callback(this.authState);

        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    // ========== GETTER METHODS ==========

    /**
     * 📊 Lấy current auth state
     * @returns {AuthState} Current auth state
     */
    getCurrentState(): AuthState {
        return this.authState;
    }

    /**
     * 👤 Lấy current user (nếu authenticated)
     * @returns {AuthUser | null} User object hoặc null
     */
    getCurrentUser(): AuthUser | null {
        return this.authState.user;
    }

    /**
     * ✅ Kiểm tra có authenticated không
     * @returns {boolean} True nếu authenticated
     */
    get isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    /**
     * ⏳ Kiểm tra có đang loading không
     * @returns {boolean} True nếu loading
     */
    get isLoading(): boolean {
        return this.authState.loading;
    }

    /**
     * 🚫 Kiểm tra có lỗi không
     * @returns {boolean} True nếu có lỗi
     */
    get hasError(): boolean {
        return !!this.authState.error;
    }

    // ========== DIAGNOSTICS & RECOVERY ==========

    /**
     * 🩺 Chẩn đoán authentication issues
     * @returns {Promise<any>} Diagnostic results
     */
    async diagnoseAuthIssues(): Promise<any> {
        return AuthErrorUtils.diagnoseAuthError(
            this.authState.error,
            this.authState,
            await this.checkPermissions(
                this.authState.user?.accessToken || '',
                [
                    ...SERVICE_SCOPES.DRIVE,
                    ...SERVICE_SCOPES.SHEETS
                ]
            )
        );
    }

    /**
     * 🔄 Thử tự động khôi phục authentication
     * @returns {Promise<AuthOperationResult>} Kết quả recovery
     */
    async attemptAutoRecovery(): Promise<AuthOperationResult> {
        try {
            const diagnosis = await this.diagnoseAuthIssues();

            if (diagnosis.canAutoRecover) {
                const success = await this.forceReauth();
                return {
                    success,
                    error: success ? undefined : 'Auto-recovery failed'
                };
            }

            return {
                success: false,
                error: 'Auto-recovery not possible for current issues'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Auto-recovery failed'
            };
        }
    }
}

export default ChromeAuthManager;