/**
 * 🔐 CHROME AUTHENTICATION MANAGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🔑 Quản lý xác thực Google OAuth2 cho Chrome Extension
 * ├── 🎫 Quản lý token, scope permissions và validation
 * ├── 👤 Lưu trữ và quản lý thông tin user
 * ├── 📊 Kiểm tra quyền truy cập Google API (Drive, Sheets, Calendar)
 * └── 🔄 Auto-refresh và cache management
 * 
 * 🏗️ CẤU TRÚC CHÍNH:
 * ├── Authentication Methods     → Đăng nhập/đăng xuất
 * ├── Token Management          → Validate, refresh, cache tokens
 * ├── Permission Checking       → Kiểm tra quyền API
 * ├── User Management           → Lưu trữ thông tin user
 * ├── State Management          → Quản lý trạng thái auth
 * └── Error Handling           → Xử lý lỗi và retry logic
 * 
 * 📦 SCOPE PERMISSIONS:
 * ├── CORE: userinfo.email, userinfo.profile
 * ├── DRIVE: drive.file (cho HabitManager)
 * ├── SHEETS: spreadsheets (cho HabitManager)
 * └── CALENDAR: calendar (cho Calendar)
 * 
 * 🔧 CÁC CHỨC NĂNG CHÍNH:
 * ├── initialize()              → Khởi tạo và kiểm tra cached user
 * ├── login()                   → Đăng nhập interactive
 * ├── silentLogin()             → Đăng nhập tự động (không popup)
 * ├── forceReauth()             → Buộc đăng nhập lại
 * ├── logout()                  → Đăng xuất và clear cache
 * ├── validateToken()           → Kiểm tra token có hợp lệ
 * ├── checkPermissions()        → Kiểm tra quyền API
 * ├── testBasicApiAccess()      → Test thử API có hoạt động
 * ├── getUserInfo()             → Lấy thông tin user từ Google
 * ├── updateToken()             → Cập nhật token mới
 * └── runDiagnostics()          → Chạy test hệ thống
 */

// 📚 INTERFACES & TYPES
// ════════════════════════════════════════════════════════════════════════════════

export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface ScopePermissionResult {
    scope: string;
    granted: boolean;
    tested: boolean;
    error?: string;
}

export interface PermissionCheckResult {
    hasRequiredScopes: boolean;
    hasDriveAccess: boolean;
    hasSheetsAccess: boolean;
    hasCalendarAccess: boolean;
    scopeDetails: ScopePermissionResult[];
    lastChecked: number;
}

export interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    expiresAt: number | null;
    hasRequiredScopes: boolean;
    grantedScopes: string[];
    errors: string[];
}

// 🎯 SCOPE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

export const SERVICE_SCOPES = {
    // 🧑‍💼 Core user info (luôn cần thiết)
    CORE: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],

    // 📁 Drive service (HabitManager, TaskManager)
    DRIVE: [
        'https://www.googleapis.com/auth/drive.file'
    ],

    // 📊 Sheets service (HabitManager, TaskManager) 
    SHEETS: [
        'https://www.googleapis.com/auth/spreadsheets'
    ],

    // 📅 Calendar service (CalendarManager)
    CALENDAR: [
        'https://www.googleapis.com/auth/calendar'
    ]
} as const;

// 🏭 MAIN CLASS
// ════════════════════════════════════════════════════════════════════════════════

class ChromeAuthManager {
    // 🔧 SINGLETON & CONFIGURATION
    // ────────────────────────────────────────────────────────────────────────────
    private static instance: ChromeAuthManager;

    // 📊 STATE MANAGEMENT
    // ────────────────────────────────────────────────────────────────────────────
    private authState: AuthState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
    };
    private listeners: ((state: AuthState) => void)[] = [];

    // 💾 CACHE SYSTEMS
    // ────────────────────────────────────────────────────────────────────────────
    private tokenValidationCache = new Map<string, { result: TokenValidationResult; timestamp: number }>();
    private permissionCache: { result: PermissionCheckResult; timestamp: number } | null = null;
    private readonly CACHE_TTL = 5 * 60 * 1000; // ⏰ 5 phút cache

    // 🚦 RATE LIMITING & FAILURE HANDLING
    // ────────────────────────────────────────────────────────────────────────────
    private authInProgress = false;
    private reauthInProgress = false;
    private lastAuthAttempt = 0;
    private consecutiveFailures = 0;
    private readonly MAX_RETRIES = 2;
    private readonly MIN_AUTH_INTERVAL = 10000; // ⏱️ 10 giây giữa các lần auth
    private readonly MAX_CONSECUTIVE_FAILURES = 3;

    // 🎯 SCOPE CONFIGURATIONS
    // ────────────────────────────────────────────────────────────────────────────
    // 🌟 Tất cả scope mà extension có thể cần
    private readonly ALL_SCOPES = [
        ...SERVICE_SCOPES.CORE,
        ...SERVICE_SCOPES.DRIVE,
        ...SERVICE_SCOPES.SHEETS,
        ...SERVICE_SCOPES.CALENDAR
    ];

    // ⭐ Scope tối thiểu cần thiết (core + drive + sheets cho chức năng cơ bản)
    private readonly REQUIRED_SCOPES = [
        ...SERVICE_SCOPES.CORE,
        ...SERVICE_SCOPES.DRIVE,
        ...SERVICE_SCOPES.SHEETS
    ];

    // 🏗️ SINGLETON CONSTRUCTOR
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🏭 Lấy instance duy nhất của ChromeAuthManager
     * @returns {ChromeAuthManager} Instance singleton
     */
    static getInstance(): ChromeAuthManager {
        if (!ChromeAuthManager.instance) {
            ChromeAuthManager.instance = new ChromeAuthManager();
        }
        return ChromeAuthManager.instance;
    }

    // 📡 STATE SUBSCRIPTION MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 📡 Đăng ký listener để nhận thông báo khi state thay đổi
     * @param listener - Function sẽ được gọi khi state thay đổi
     * @returns Function để hủy đăng ký
     */
    subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.push(listener);
        // 📤 Gửi state hiện tại ngay lập tức
        listener(this.authState);

        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * 📢 Thông báo tới tất cả listeners về thay đổi state
     * @private
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener(this.authState);
            } catch (error) {
                console.error('❌ Listener notification error:', error);
            }
        });
    }

    /**
     * 🔄 Cập nhật state và thông báo listeners
     * @private
     * @param partial - Phần state cần cập nhật
     */
    private updateState(partial: Partial<AuthState>): void {
        this.authState = { ...this.authState, ...partial };
        this.notifyListeners();
    }

    // 🚀 INITIALIZATION METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🚀 Khởi tạo ChromeAuthManager
     * - Kiểm tra Chrome Identity API
     * - Verify manifest configuration
     * - Tìm cached user và validate token
     * - Thử silent login nếu chưa có user
     */
    async initialize(): Promise<void> {
        if (this.authState.loading) return;

        this.updateState({ loading: true, error: null });

        try {
            console.log('🚀 Initializing ChromeAuthManager...');

            // ✅ Verify Chrome Identity API
            if (!chrome?.identity) {
                throw new Error('Chrome Identity API not available');
            }

            // ✅ Verify manifest configuration
            const manifest = chrome.runtime.getManifest();
            if (!manifest.oauth2?.client_id) {
                throw new Error('OAuth2 client_id not configured in manifest');
            }

            console.log('🔑 OAuth2 Client ID found:', manifest.oauth2.client_id.substring(0, 20) + '...');

            // 💾 Check for cached user
            const cachedUser = await this.getCachedUser();
            if (cachedUser) {
                console.log('👤 Found cached user, validating token...');

                const validation = await this.validateToken(cachedUser.accessToken);
                if (validation.isValid) {
                    this.updateState({
                        isAuthenticated: true,
                        user: cachedUser,
                        loading: false
                    });
                    return;
                } else {
                    console.log('❌ Cached token invalid, clearing cache...', validation.errors);
                    await this.clearCachedUser();
                }
            }

            // 🤫 Try silent authentication
            await this.silentLogin();

        } catch (error) {
            console.error('❌ Auth initialization error:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Initialization failed'
            });
        }
    }

    // 🔐 AUTHENTICATION METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🤫 Đăng nhập thầm lặng (không hiện popup)
     * - Thử lấy token từ Chrome cache
     * - Timeout 8s để tránh treo
     * @private
     */
    private async silentLogin(): Promise<void> {
        return new Promise((resolve) => {
            // ⏰ Timeout để tránh treo
            const timeoutId = setTimeout(() => {
                console.log('⏰ Silent login timeout');
                this.updateState({
                    isAuthenticated: false,
                    user: null,
                    loading: false
                });
                resolve();
            }, 8000);

            chrome.identity.getAuthToken(
                {
                    interactive: false,
                    scopes: this.ALL_SCOPES // 🎯 Thử lấy tất cả scope silently
                },
                async (token: string | undefined) => {
                    clearTimeout(timeoutId);

                    if (chrome.runtime.lastError || !token) {
                        console.log('🤫 Silent login failed:', chrome.runtime.lastError?.message || 'No token');
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false
                        });
                        resolve();
                        return;
                    }

                    try {
                        console.log('🎫 Silent login token received, getting user info...');
                        const user = await this.getUserInfo(token);
                        await this.cacheUser(user);
                        this.updateState({
                            isAuthenticated: true,
                            user,
                            loading: false
                        });
                        console.log('✅ Silent login successful for:', user.email);
                    } catch (error) {
                        console.error('❌ Silent login error:', error);
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false
                        });
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * 🔐 Đăng nhập interactive (hiện popup cho user)
     * - Rate limiting và failure handling
     * - Clear cached tokens trước khi auth
     * - Validate token sau khi nhận
     * @returns {Promise<boolean>} True nếu thành công
     */
    async login(): Promise<boolean> {
        // 🚫 Prevent concurrent auth attempts
        if (this.authInProgress || this.reauthInProgress) {
            console.log('🔄 Authentication already in progress');
            return false;
        }

        // ⏱️ Rate limiting
        const now = Date.now();
        if (now - this.lastAuthAttempt < this.MIN_AUTH_INTERVAL) {
            const waitTime = this.MIN_AUTH_INTERVAL - (now - this.lastAuthAttempt);
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next auth attempt`);
            return false;
        }

        // 🚨 Check consecutive failures
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            console.error('🚨 Too many consecutive auth failures, stopping attempts');
            this.updateState({
                loading: false,
                error: 'Authentication failed multiple times. Please wait a few minutes before trying again.'
            });
            return false;
        }

        this.authInProgress = true;
        this.lastAuthAttempt = now;
        this.updateState({ loading: true, error: null });

        try {
            console.log('🔐 Starting interactive authentication...');

            // 🧹 Clear cached tokens
            await this.clearAllCachedTokens();
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 🎫 Get token with all scopes
            const token = await this.getInteractiveToken();
            if (!token) {
                throw new Error('No token received from authentication');
            }

            console.log('🔍 Interactive token received, validating...');

            // ✅ Validate token immediately
            const validation = await this.validateToken(token);
            if (!validation.isValid) {
                throw new Error(`Token validation failed: ${validation.errors.join(', ')}`);
            }

            // 👤 Get user info
            const user = await this.getUserInfo(token);
            await this.cacheUser(user);

            this.updateState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null
            });

            this.consecutiveFailures = 0;
            console.log('✅ Interactive login successful for:', user.email);
            return true;

        } catch (error) {
            this.consecutiveFailures++;
            console.error('❌ Login failed:', error);

            const errorMessage = this.getErrorMessage(error);
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: errorMessage
            });
            return false;
        } finally {
            this.authInProgress = false;
        }
    }

    /**
     * 🎫 Lấy token interactive từ Chrome
     * - Kiểm tra manifest permissions
     * - Timeout 45s
     * - Xử lý các loại lỗi khác nhau
     * @private
     * @returns {Promise<string | null>} Access token hoặc null
     */
    private async getInteractiveToken(): Promise<string | null> {
        return new Promise((resolve, reject) => {
            // ⏰ Timeout protection
            const timeoutId = setTimeout(() => {
                reject(new Error('Authentication timeout after 45 seconds'));
            }, 45000);

            try {
                // ✅ First check if manifest has correct permissions
                if (!this.checkManifestPermissions()) {
                    reject(new Error('Extension configuration error: Missing required permissions'));
                    return;
                }

                chrome.identity.getAuthToken(
                    {
                        interactive: true,
                        scopes: this.ALL_SCOPES // 🎯 Request all scopes
                    },
                    (token: string | undefined) => {
                        clearTimeout(timeoutId);

                        if (chrome.runtime.lastError) {
                            const errorMessage = chrome.runtime.lastError.message || 'Unknown auth error';

                            // 🚫 Handle specific consent errors
                            if (errorMessage.includes('access_denied') || errorMessage.includes('permission')) {
                                reject(new Error('User denied required permissions. Please grant all requested permissions.'));
                            } else {
                                reject(new Error(errorMessage));
                            }
                            return;
                        }

                        if (!token) {
                            reject(new Error('No token received'));
                            return;
                        }

                        resolve(token);
                    }
                );
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * 🔄 Buộc đăng nhập lại (force reauth)
     * - Reset hoàn toàn OAuth state
     * - Thực hiện login mới
     * @returns {Promise<boolean>} True nếu thành công
     */
    async forceReauth(): Promise<boolean> {
        if (this.reauthInProgress) {
            console.log('🔄 Reauth already in progress');
            return false;
        }

        // 🚨 Prevent too frequent reauth attempts
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            console.error('🚨 Too many reauth failures, please wait');
            return false;
        }

        this.reauthInProgress = true;
        console.log('🔄 Starting force re-authentication...');
        this.updateState({ loading: true, error: null });

        try {
            // 🧹 Perform full reset
            await this.performFullOAuthReset();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 🔄 Reset local state
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: true,
                error: null
            });

            // 🔐 Attempt fresh login
            const success = await this.login();
            if (!success) {
                throw new Error('Reauth login failed');
            }

            console.log('✅ Force reauth completed successfully');
            return true;

        } catch (error) {
            this.consecutiveFailures++;
            const errorMessage = this.getErrorMessage(error);
            console.error('❌ Force reauth failed:', error);
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: errorMessage
            });
            return false;
        } finally {
            this.reauthInProgress = false;
        }
    }

    /**
     * 🚪 Đăng xuất và clear tất cả cache
     * - Revoke token
     * - Clear Chrome identity cache
     * - Clear extension storage
     * - Reset local state
     */
    async logout(): Promise<void> {
        this.updateState({ loading: true, error: null });

        try {
            console.log('🚪 Starting logout...');
            await this.performFullOAuthReset();

            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });

            // 🔄 Reset failure counters
            this.consecutiveFailures = 0;
            this.authInProgress = false;
            this.reauthInProgress = false;

            console.log('✅ Logout completed');

        } catch (error) {
            console.error('❌ Logout error:', error);
            // 🧹 Still clear state even if cleanup fails
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });
        }
    }

    // 🎫 TOKEN VALIDATION METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔍 Validate access token
     * - Kiểm tra token format và length
     * - Gọi Google tokeninfo API
     * - Kiểm tra expiration và required scopes
     * - Cache kết quả validation
     * @param accessToken - Token cần validate
     * @param useCache - Có sử dụng cache không (default: true)
     * @returns {Promise<TokenValidationResult>} Kết quả validation
     */
    async validateToken(accessToken: string, useCache: boolean = true): Promise<TokenValidationResult> {
        if (!accessToken || accessToken.length < 10) {
            return {
                isValid: false,
                isExpired: true,
                expiresAt: null,
                hasRequiredScopes: false,
                grantedScopes: [],
                errors: ['No valid access token provided']
            };
        }

        const cacheKey = accessToken.substring(0, 30);
        if (useCache && this.tokenValidationCache.has(cacheKey)) {
            const cached = this.tokenValidationCache.get(cacheKey)!;
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                console.log('💾 Using cached token validation result');
                return cached.result;
            }
        }

        try {
            console.log('🔍 Validating token:', accessToken.substring(0, 20) + '...');
            const tokenInfo = await this.getTokenInfo(accessToken);

            const expiresIn = parseInt(tokenInfo.expires_in || '0');
            const expiresAt = Date.now() + (expiresIn * 1000);
            const isExpired = expiresIn <= 300; // ⏰ Coi như expired nếu còn < 5 phút

            const grantedScopes = (tokenInfo.scope || '').split(' ').filter(Boolean);
            const hasRequiredScopes = this.REQUIRED_SCOPES.every(scope =>
                grantedScopes.includes(scope)
            );

            console.log('📊 Token validation:', {
                expires_in: expiresIn,
                is_expired: isExpired,
                granted_scopes: grantedScopes.length,
                has_required: hasRequiredScopes
            });

            const errors: string[] = [];
            if (isExpired) errors.push('Token expired or expiring soon');
            if (!hasRequiredScopes) {
                const missingScopes = this.REQUIRED_SCOPES.filter(scope => !grantedScopes.includes(scope));
                errors.push(`Missing required scopes: ${missingScopes.join(', ')}`);
            }

            const result: TokenValidationResult = {
                isValid: !isExpired && hasRequiredScopes,
                isExpired,
                expiresAt: isExpired ? null : expiresAt,
                hasRequiredScopes,
                grantedScopes,
                errors
            };

            if (useCache) {
                this.tokenValidationCache.set(cacheKey, { result, timestamp: Date.now() });
            }

            return result;

        } catch (error) {
            console.error('❌ Token validation error:', error);
            const result: TokenValidationResult = {
                isValid: false,
                isExpired: true,
                expiresAt: null,
                hasRequiredScopes: false,
                grantedScopes: [],
                errors: [error instanceof Error ? error.message : 'Token validation failed']
            };

            if (useCache) {
                this.tokenValidationCache.set(cacheKey, { result, timestamp: Date.now() });
            }

            return result;
        }
    }

    /**
     * 📊 Lấy thông tin token từ Google tokeninfo API
     * @private
     * @param token - Access token
     * @returns {Promise<any>} Token info object
     */
    private async getTokenInfo(token: string): Promise<any> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(token)}`,
                {
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Token info request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 🔄 Cập nhật token mới cho user hiện tại
     * @param newToken - Token mới
     */
    async updateToken(newToken: string): Promise<void> {
        if (this.authState.user) {
            const updatedUser = { ...this.authState.user, accessToken: newToken };
            await this.cacheUser(updatedUser);
            this.updateState({ user: updatedUser });

            // 🧹 Clear caches to force fresh validation
            this.tokenValidationCache.clear();
            this.permissionCache = null;
        }
    }

    // 🔐 PERMISSION CHECKING METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔍 Kiểm tra permissions và quyền truy cập API
     * - Check granted scopes from token
     * - Test thực tế API calls
     * - Cache kết quả
     * @param token - Token để check (optional)
     * @param requiredScopes - Scopes cần thiết (optional)
     * @returns {Promise<PermissionCheckResult>} Kết quả check permission
     */
    async checkPermissions(token?: string, requiredScopes?: string[]): Promise<PermissionCheckResult> {
        const currentToken = token || this.getCurrentToken();
        const scopesToCheck = requiredScopes || this.REQUIRED_SCOPES;

        if (!currentToken) {
            console.log('❌ No token available for permission check');
            return this.createEmptyPermissionResult();
        }

        // 💾 Use cache if available and valid
        if (this.permissionCache &&
            (Date.now() - this.permissionCache.timestamp) < this.CACHE_TTL) {
            return this.permissionCache.result;
        }

        try {
            console.log('🔍 Checking permissions for scopes:', scopesToCheck);

            // 📊 Get token info to check granted scopes
            const tokenInfo = await this.getTokenInfo(currentToken);
            const grantedScopes = (tokenInfo.scope || '').split(' ').filter(Boolean);

            console.log('✅ Granted scopes:', grantedScopes);

            // 🔍 Check each scope
            const scopeDetails: ScopePermissionResult[] = [];

            // 👤 Core scopes
            SERVICE_SCOPES.CORE.forEach(scope => {
                scopeDetails.push({
                    scope,
                    granted: grantedScopes.includes(scope),
                    tested: false // Core scopes don't need API testing
                });
            });

            // 📁 Drive scope with API test
            const driveScope = SERVICE_SCOPES.DRIVE[0];
            const hasDriveScope = grantedScopes.includes(driveScope);
            const driveApiAccess = hasDriveScope ? await this.testBasicApiAccess('drive', currentToken) : false;

            scopeDetails.push({
                scope: driveScope,
                granted: hasDriveScope && driveApiAccess,
                tested: true,
                error: !driveApiAccess ? 'API access test failed' : undefined
            });

            // 📊 Sheets scope with API test
            const sheetsScope = SERVICE_SCOPES.SHEETS[0];
            const hasSheetsScope = grantedScopes.includes(sheetsScope);
            const sheetsApiAccess = hasSheetsScope ? await this.testBasicApiAccess('sheets', currentToken) : false;

            scopeDetails.push({
                scope: sheetsScope,
                granted: hasSheetsScope && sheetsApiAccess,
                tested: true,
                error: !sheetsApiAccess ? 'API access test failed' : undefined
            });

            // 📅 Calendar scope with API test (optional)
            const calendarScope = SERVICE_SCOPES.CALENDAR[0];
            const hasCalendarScope = grantedScopes.includes(calendarScope);
            const calendarApiAccess = hasCalendarScope ? await this.testBasicApiAccess('calendar', currentToken) : false;

            scopeDetails.push({
                scope: calendarScope,
                granted: hasCalendarScope && calendarApiAccess,
                tested: true,
                error: !calendarApiAccess && hasCalendarScope ? 'API access test failed' : undefined
            });

            // 🏗️ Build result
            const result: PermissionCheckResult = {
                hasRequiredScopes: scopesToCheck.every(scope =>
                    scopeDetails.find(detail => detail.scope === scope)?.granted || false
                ),
                hasDriveAccess: scopeDetails.find(d => d.scope === driveScope)?.granted || false,
                hasSheetsAccess: scopeDetails.find(d => d.scope === sheetsScope)?.granted || false,
                hasCalendarAccess: scopeDetails.find(d => d.scope === calendarScope)?.granted || false,
                scopeDetails,
                lastChecked: Date.now()
            };

            // 💾 Cache the result
            this.permissionCache = { result, timestamp: Date.now() };

            console.log('📊 Permission check completed:', result);
            return result;

        } catch (error) {
            console.error('❌ Error checking permissions:', error);
            return this.createEmptyPermissionResult();
        }
    }

    /**
     * 🆕 Tạo empty permission result khi có lỗi
     * @private
     * @returns {PermissionCheckResult} Empty result
     */
    private createEmptyPermissionResult(): PermissionCheckResult {
        return {
            hasRequiredScopes: false,
            hasDriveAccess: false,
            hasSheetsAccess: false,
            hasCalendarAccess: false,
            scopeDetails: [],
            lastChecked: Date.now()
        };
    }

    /**
     * 🧪 Test basic API access (không phải service-specific operations)
     * @private
     * @param service - Loại service: 'drive' | 'sheets' | 'calendar'
     * @param token - Access token
     * @returns {Promise<boolean>} True nếu API có thể truy cập
     */
    private async testBasicApiAccess(service: 'drive' | 'sheets' | 'calendar', token: string): Promise<boolean> {
        try {
            console.log(`🧪 Testing basic ${service} API access...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            let url: string;
            switch (service) {
                case 'drive':
                    url = 'https://www.googleapis.com/drive/v3/about?fields=user';
                    break;
                case 'sheets':
                    // 📊 Just test API availability, not create actual sheets
                    url = 'https://sheets.googleapis.com/v4/spreadsheets?q=name%3D"test"'; // Search for non-existent sheet
                    break;
                case 'calendar':
                    url = 'https://www.googleapis.com/calendar/v3/users/me/settings';
                    break;
                default:
                    return false;
            }

            const options: RequestInit = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                signal: controller.signal,
                method: 'GET'
            };

            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            const success = response.ok || response.status === 400; // 🟡 400 might be ok for some test queries
            console.log(`${service} API access test:`, success ? '✅ SUCCESS' : '❌ FAILED', response.status);

            return success;

        } catch (error) {
            console.warn(`❌ ${service} API access test failed:`, error);
            return false;
        }
    }

    // 🎯 SCOPE UTILITIES
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 📋 Lấy danh sách required scopes
     * @returns {string[]} Array of required scopes
     */
    getRequiredScopes(): string[] {
        return [...this.REQUIRED_SCOPES];
    }

    /**
     * 🌟 Lấy danh sách tất cả scopes
     * @returns {string[]} Array of all scopes
     */
    getAllScopes(): string[] {
        return [...this.ALL_SCOPES];
    }

    /**
     * 🎯 Lấy scopes cho service cụ thể
     * @param service - Service name
     * @returns {string[]} Array of scopes for service
     */
    getScopesForService(service: keyof typeof SERVICE_SCOPES): string[] {
        return [...SERVICE_SCOPES[service]];
    }

    /**
     * 🔍 Kiểm tra có scope cụ thể không
     * @param scope - Scope cần kiểm tra
     * @param token - Token để check (optional)
     * @returns {boolean} True nếu có scope
     */
    hasScope(scope: string, token?: string): boolean {
        const currentToken = token || this.getCurrentToken();
        if (!currentToken) return false;

        // 💾 Check from cached permission result if available
        if (this.permissionCache) {
            const scopeDetail = this.permissionCache.result.scopeDetails.find(detail => detail.scope === scope);
            if (scopeDetail) {
                return scopeDetail.granted;
            }
        }

        return false;
    }

    // 👤 USER MANAGEMENT METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 👤 Lấy thông tin user từ Google API
     * @private
     * @param token - Access token
     * @returns {Promise<User>} User object
     */
    private async getUserInfo(token: string): Promise<User> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to get user info: ${response.status}`);
            }

            const data = await response.json();
            return {
                id: data.id,
                email: data.email,
                name: data.name,
                picture: data.picture,
                accessToken: token
            };
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // 💾 CACHING METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 💾 Lưu user vào Chrome storage
     * @private
     * @param user - User object để cache
     */
    private async cacheUser(user: User): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                'flexbookmark_user': user,
                'flexbookmark_auth_timestamp': Date.now()
            }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('⚠️ Failed to cache user:', chrome.runtime.lastError.message);
                }
                resolve();
            });
        });
    }

    /**
     * 👤 Lấy cached user từ Chrome storage
     * @private
     * @returns {Promise<User | null>} Cached user hoặc null
     */
    private async getCachedUser(): Promise<User | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['flexbookmark_user', 'flexbookmark_auth_timestamp'], (result) => {
                if (chrome.runtime.lastError) {
                    console.warn('⚠️ Failed to get cached user:', chrome.runtime.lastError.message);
                    resolve(null);
                    return;
                }

                if (result.flexbookmark_user && result.flexbookmark_auth_timestamp) {
                    const cacheAge = Date.now() - result.flexbookmark_auth_timestamp;
                    if (cacheAge < 24 * 60 * 60 * 1000) { // ⏰ 24 hours
                        resolve(result.flexbookmark_user);
                        return;
                    }
                }
                resolve(null);
            });
        });
    }

    /**
     * 🧹 Xóa cached user
     * @private
     */
    private async clearCachedUser(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.remove(['flexbookmark_user', 'flexbookmark_auth_timestamp'], () => {
                resolve();
            });
        });
    }

    /**
     * 🧹 Clear tất cả caches
     */
    clearAllCaches(): void {
        this.tokenValidationCache.clear();
        this.permissionCache = null;
        console.log('🧹 All caches cleared');
    }

    // 🧹 CLEANUP METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔄 Reset hoàn toàn OAuth state
     * @private
     */
    private async performFullOAuthReset(): Promise<void> {
        console.log('🔄 Performing full OAuth reset...');

        try {
            // 🚫 Revoke current token
            const currentToken = this.getCurrentToken();
            if (currentToken) {
                await this.revokeToken(currentToken);
            }

            // 🧹 Clear all Chrome identity caches
            await this.clearAllCachedTokens();

            // 🧹 Clear local caches
            await this.clearCachedUser();
            this.tokenValidationCache.clear();
            this.permissionCache = null;

            // 🧹 Clear extension storage
            if (chrome.storage?.local) {
                await new Promise<void>((resolve) => {
                    chrome.storage.local.clear(() => {
                        console.log('🗑️ Extension storage cleared');
                        resolve();
                    });
                });
            }

        } catch (error) {
            console.warn('⚠️ OAuth reset encountered errors:', error);
        }
    }

    /**
     * 🧹 Clear tất cả cached tokens từ Chrome
     * @private
     */
    private async clearAllCachedTokens(): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.clearAllCachedAuthTokens(() => {
                if (chrome.runtime.lastError) {
                    console.warn('⚠️ Error clearing cached tokens:', chrome.runtime.lastError.message);
                } else {
                    console.log('🧹 All cached tokens cleared');
                }
                resolve();
            });
        });
    }

    /**
     * 🚫 Revoke token từ Google
     * @private
     * @param token - Token cần revoke
     * @returns {Promise<boolean>} True nếu thành công
     */
    private async revokeToken(token: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
                method: 'POST',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const success = response.ok;
            if (success) {
                console.log('✅ Token revoked successfully');
            }
            return success;
        } catch (error) {
            console.error('❌ Token revocation failed:', error);
            return false;
        }
    }

    // 🔍 VALIDATION METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * ✅ Kiểm tra manifest có đủ permissions không
     * @private
     * @returns {boolean} True nếu manifest OK
     */
    private checkManifestPermissions(): boolean {
        try {
            const manifest = chrome.runtime.getManifest();
            const oauth2Scopes = manifest.oauth2?.scopes || [];
            const hasRequiredScopes = this.REQUIRED_SCOPES.every(scope =>
                oauth2Scopes.includes(scope)
            );

            if (!hasRequiredScopes) {
                console.error('❌ Missing required scopes in manifest.json');
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Error checking manifest permissions:', error);
            return false;
        }
    }

    // 📊 STATE GETTERS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔍 Kiểm tra có authenticated không
     * @returns {boolean} True nếu đã authenticated
     */
    get isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    /**
     * 👤 Lấy current user
     * @returns {User | null} Current user hoặc null
     */
    getCurrentUser(): User | null {
        return this.authState.user;
    }

    /**
     * 🎫 Lấy current access token
     * @returns {string | null} Current token hoặc null
     */
    getCurrentToken(): string | null {
        return this.authState.user?.accessToken || null;
    }

    /**
     * 📊 Lấy current auth state
     * @returns {AuthState} Current state copy
     */
    getCurrentState(): AuthState {
        return { ...this.authState };
    }

    // ❌ ERROR HANDLING METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 📝 Convert error thành user-friendly message
     * @private
     * @param error - Error object
     * @returns {string} User-friendly error message
     */
    private getErrorMessage(error: any): string {
        if (!error) return 'Unknown error occurred';

        const errorString = error instanceof Error ? error.message : String(error);

        if (errorString.includes('Authorization page could not be loaded')) {
            return 'Unable to load Google authorization page. Please check your internet connection and try again.';
        } else if (errorString.includes('OAuth2 not granted or revoked')) {
            return 'OAuth2 access was revoked. Please sign in again.';
        } else if (errorString.includes('User did not approve')) {
            return 'Authentication cancelled. Please complete the sign-in process.';
        } else if (errorString.includes('timeout')) {
            return 'Authentication timed out. Please try again.';
        } else {
            return errorString.length > 100 ? 'Authentication failed. Please try again.' : errorString;
        }
    }

    // 🔧 DEBUG & UTILITY METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    /**
     * 🔬 Chạy diagnostics để debug
     * @returns {Promise<any>} Object chứa thông tin debug
     */
    async runDiagnostics(): Promise<any> {
        const token = this.getCurrentToken();
        let tokenInfo = null;
        let permissions = null;

        try {
            if (token) {
                tokenInfo = await this.getTokenInfo(token);
                permissions = await this.checkPermissions();
            }
        } catch (error) {
            console.error('❌ Diagnostics error:', error);
        }

        return {
            // 📊 Auth state
            authState: this.authState,
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenInfo,
            permissions,

            // 🚨 Error tracking
            consecutiveFailures: this.consecutiveFailures,
            authInProgress: this.authInProgress,
            reauthInProgress: this.reauthInProgress,

            // 💾 Cache status
            cacheStatus: {
                tokenCache: this.tokenValidationCache.size,
                permissionCache: !!this.permissionCache
            },

            // 🌐 Environment
            chromeIdentityAvailable: !!(chrome && chrome.identity),
            manifestOAuth: !!(chrome.runtime.getManifest().oauth2?.client_id),

            // ⚙️ Config
            requiredScopes: this.REQUIRED_SCOPES,
            allScopes: this.ALL_SCOPES
        };
    }
}

// 🎯 EXPORT
// ════════════════════════════════════════════════════════════════════════════════

export default ChromeAuthManager;