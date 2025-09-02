// src/utils/chromeAuth.ts - Fixed permission checking and token validation

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

export interface PermissionCheckResult {
    hasDrive: boolean;
    hasSheets: boolean;
    hasCalendar: boolean;
    allRequired: boolean;
    folderStructureExists?: boolean;
    lastChecked?: number;
}

export interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    expiresAt: number | null;
    hasRequiredScopes: boolean;
    errors: string[];
}

class ChromeAuthManager {
    private static instance: ChromeAuthManager;
    private authState: AuthState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
    };
    private listeners: ((state: AuthState) => void)[] = [];
    private tokenValidationCache = new Map<string, { result: TokenValidationResult; timestamp: number }>();
    private permissionCache: { result: PermissionCheckResult; timestamp: number } | null = null;
    private readonly CACHE_TTL = 3 * 60 * 1000; // Reduced to 3 minutes
    private authInProgress = false;
    private reauthInProgress = false;
    private lastAuthAttempt = 0;
    private consecutiveFailures = 0;
    private readonly MAX_RETRIES = 2;
    private readonly MIN_AUTH_INTERVAL = 10000; // 10 seconds between auth attempts
    private readonly MAX_CONSECUTIVE_FAILURES = 3;

    // Required scopes for the application
    private readonly REQUIRED_SCOPES = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets'
    ];

    private readonly OPTIONAL_SCOPES = [
        'https://www.googleapis.com/auth/calendar'
    ];

    static getInstance(): ChromeAuthManager {
        if (!ChromeAuthManager.instance) {
            ChromeAuthManager.instance = new ChromeAuthManager();
        }
        return ChromeAuthManager.instance;
    }

    // ========== SUBSCRIPTION MANAGEMENT ==========

    subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.push(listener);
        // Send current state immediately
        listener(this.authState);

        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener(this.authState);
            } catch (error) {
                console.error('Listener notification error:', error);
            }
        });
    }

    private updateState(partial: Partial<AuthState>): void {
        this.authState = { ...this.authState, ...partial };
        this.notifyListeners();
    }

    // ========== INITIALIZATION ==========

    async initialize(): Promise<void> {
        if (this.authState.loading) return;

        this.updateState({ loading: true, error: null });

        try {
            console.log('Initializing ChromeAuthManager...');

            // Verify Chrome Identity API
            if (!chrome?.identity) {
                throw new Error('Chrome Identity API not available');
            }

            // Verify manifest configuration
            const manifest = chrome.runtime.getManifest();
            if (!manifest.oauth2?.client_id) {
                throw new Error('OAuth2 client_id not configured in manifest');
            }

            console.log('OAuth2 Client ID found:', manifest.oauth2.client_id.substring(0, 20) + '...');

            // Check for cached user
            const cachedUser = await this.getCachedUser();
            if (cachedUser) {
                console.log('Found cached user, validating token...');

                const validation = await this.validateToken(cachedUser.accessToken);
                if (validation.isValid) {
                    this.updateState({
                        isAuthenticated: true,
                        user: cachedUser,
                        loading: false
                    });
                    return;
                } else {
                    console.log('Cached token invalid, clearing cache...', validation.errors);
                    await this.clearCachedUser();
                }
            }

            // Try silent authentication
            await this.silentLogin();

        } catch (error) {
            console.error('Auth initialization error:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Initialization failed'
            });
        }
    }

    // ========== AUTHENTICATION METHODS ==========

    private async silentLogin(): Promise<void> {
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                console.log('Silent login timeout');
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
                    scopes: this.REQUIRED_SCOPES
                },
                async (token: string | undefined) => {
                    clearTimeout(timeoutId);

                    if (chrome.runtime.lastError || !token) {
                        console.log('Silent login failed:', chrome.runtime.lastError?.message || 'No token');
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false
                        });
                        resolve();
                        return;
                    }

                    try {
                        console.log('Silent login token received, getting user info...');
                        const user = await this.getUserInfo(token);
                        await this.cacheUser(user);
                        this.updateState({
                            isAuthenticated: true,
                            user,
                            loading: false
                        });
                        console.log('Silent login successful for:', user.email);
                    } catch (error) {
                        console.error('Silent login error:', error);
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

    async login(): Promise<boolean> {
        // Prevent concurrent auth attempts
        if (this.authInProgress || this.reauthInProgress) {
            console.log('Authentication already in progress');
            return false;
        }

        // Rate limiting
        const now = Date.now();
        if (now - this.lastAuthAttempt < this.MIN_AUTH_INTERVAL) {
            const waitTime = this.MIN_AUTH_INTERVAL - (now - this.lastAuthAttempt);
            console.log(`Rate limiting: waiting ${waitTime}ms before next auth attempt`);
            return false;
        }

        // Check consecutive failures
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            console.error('Too many consecutive auth failures, stopping attempts');
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
            console.log('Starting interactive authentication...');

            // Clear cached tokens
            await this.clearAllCachedTokens();
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get token with explicit scopes
            const token = await this.getInteractiveToken();
            if (!token) {
                throw new Error('No token received from authentication');
            }

            console.log('Interactive token received, validating...');

            // Validate token immediately
            const validation = await this.validateToken(token);
            if (!validation.isValid) {
                throw new Error(`Token validation failed: ${validation.errors.join(', ')}`);
            }

            // Get user info
            const user = await this.getUserInfo(token);
            await this.cacheUser(user);

            this.updateState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null
            });

            this.consecutiveFailures = 0;
            console.log('Interactive login successful for:', user.email);
            return true;

        } catch (error) {
            this.consecutiveFailures++;
            console.error('Login failed:', error);

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

    private async getInteractiveToken(): Promise<string | null> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Authentication timeout after 45 seconds'));
            }, 45000);

            try {
                // First check if manifest has correct permissions
                if (!this.checkManifestPermissions()) {
                    reject(new Error('Extension configuration error: Missing required permissions'));
                    return;
                }

                chrome.identity.getAuthToken(
                    {
                        interactive: true,
                        scopes: this.REQUIRED_SCOPES
                    },
                    (token: string | undefined) => {
                        clearTimeout(timeoutId);

                        if (chrome.runtime.lastError) {
                            const errorMessage = chrome.runtime.lastError.message || 'Unknown auth error';

                            // Handle specific consent errors
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

    async forceReauth(): Promise<boolean> {
        if (this.reauthInProgress) {
            console.log('Reauth already in progress');
            return false;
        }

        // Prevent too frequent reauth attempts
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            console.error('Too many reauth failures, please wait');
            return false;
        }

        this.reauthInProgress = true;
        console.log('Starting force re-authentication...');
        this.updateState({ loading: true, error: null });

        try {
            // Perform full reset
            await this.performFullOAuthReset();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Reset local state
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: true,
                error: null
            });

            // Attempt fresh login
            const success = await this.login();
            if (!success) {
                throw new Error('Reauth login failed');
            }

            // Better permission verification with longer wait
            await new Promise(resolve => setTimeout(resolve, 3000));
            const permissions = await this.checkAllPermissions();

            if (!permissions.allRequired) {
                console.warn('Required permissions not available after reauth:', permissions);
                // Don't fail completely, just warn
                this.updateState({
                    error: 'Some permissions may be missing. Please ensure Drive and Sheets access is granted.'
                });
            }

            console.log('Force reauth completed. Permissions:', permissions);
            return true;

        } catch (error) {
            this.consecutiveFailures++;
            const errorMessage = this.getErrorMessage(error);
            console.error('Force reauth failed:', error);
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

    // ========== IMPROVED PERMISSION CHECKING ==========

    async checkAllPermissions(token?: string): Promise<PermissionCheckResult> {
        const currentToken = token || this.getCurrentToken();
        if (!currentToken) {
            console.log('No token available for permission check');
            return {
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false,
                lastChecked: Date.now()
            };
        }

        // Use cache if available
        const cacheKey = `permissions_${currentToken.substring(0, 20)}`;
        if (this.permissionCache &&
            (Date.now() - this.permissionCache.timestamp) < this.CACHE_TTL &&
            this.permissionCache.result.lastChecked) {
            return this.permissionCache.result;
        }

        try {
            console.log('Checking permissions for token:', currentToken.substring(0, 20) + '...');

            // First validate the token to get granted scopes
            const tokenInfo = await this.getTokenInfo(currentToken);
            const grantedScopes = (tokenInfo.scope || '').split(' ').filter(Boolean);

            // Check if required scopes are present
            const hasDriveScope = grantedScopes.includes('https://www.googleapis.com/auth/drive.file');
            const hasSheetsScope = grantedScopes.includes('https://www.googleapis.com/auth/spreadsheets');
            const hasCalendarScope = grantedScopes.includes('https://www.googleapis.com/auth/calendar');

            // Test actual API access with retry logic
            const [driveAccess, sheetsAccess] = await Promise.all([
                this.testDriveAccessWithRetry(currentToken),
                this.testSheetsAccessWithRetry(currentToken)
            ]);

            const result: PermissionCheckResult = {
                hasDrive: hasDriveScope && driveAccess,
                hasSheets: hasSheetsScope && sheetsAccess,
                hasCalendar: hasCalendarScope,
                allRequired: (hasDriveScope && driveAccess) && (hasSheetsScope && sheetsAccess),
                lastChecked: Date.now()
            };

            // Cache the result
            this.permissionCache = { result, timestamp: Date.now() };
            return result;

        } catch (error) {
            console.error('Error checking permissions:', error);
            return {
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false,
                lastChecked: Date.now()
            };
        }
    }

    // Improved API access testing
    private async testDriveAccess(token: string): Promise<boolean> {
        try {
            console.log('Testing Drive API access...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(
                'https://www.googleapis.com/drive/v3/about?fields=user',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log('Drive access test: SUCCESS', data.user?.emailAddress || 'Unknown user');
                return true;
            } else {
                console.log('Drive access test: FAILED', response.status, response.statusText);
                if (response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    console.log('Drive 403 error details:', errorData);
                }
                return false;
            }

        } catch (error) {
            console.warn('Drive access test failed:', error);
            return false;
        }
    }

    private async testSheetsAccess(token: string): Promise<boolean> {
        try {
            console.log('Testing Sheets API access...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            // Try a simple request that requires sheets permission
            const response = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        properties: {
                            title: 'Permission Test - Delete Me'
                        }
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (response.ok) {
                // Delete the test spreadsheet immediately
                const data = await response.json();
                const spreadsheetId = data.spreadsheetId;

                if (spreadsheetId) {
                    // Clean up test spreadsheet
                    try {
                        await fetch(
                            `https://www.googleapis.com/drive/v3/files/${spreadsheetId}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            }
                        );
                        console.log('Sheets access test: SUCCESS (test file cleaned up)');
                    } catch (deleteError) {
                        console.warn('Failed to clean up test spreadsheet:', deleteError);
                    }
                }

                return true;
            } else {
                console.log('Sheets access test: FAILED', response.status, response.statusText);
                if (response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    console.log('Sheets 403 error details:', errorData);
                }
                return false;
            }

        } catch (error) {
            console.warn('Sheets access test failed:', error);
            return false;
        }
    }

    private async testDriveAccessWithRetry(token: string, retries = 2): Promise<boolean> {
        for (let i = 0; i <= retries; i++) {
            try {
                const result = await this.testDriveAccess(token);
                if (result) return true;
                if (i < retries) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            } catch (error) {
                if (i === retries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        return false;
    }

    private async testSheetsAccessWithRetry(token: string, retries = 2): Promise<boolean> {
        for (let i = 0; i <= retries; i++) {
            try {
                const result = await this.testSheetsAccess(token);
                if (result) return true;
                if (i < retries) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            } catch (error) {
                if (i === retries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        return false;
    }

    // ========== IMPROVED TOKEN VALIDATION ==========

    async validateToken(accessToken: string, useCache: boolean = true): Promise<TokenValidationResult> {
        if (!accessToken || accessToken.length < 10) {
            return {
                isValid: false,
                isExpired: true,
                expiresAt: null,
                hasRequiredScopes: false,
                errors: ['No valid access token provided']
            };
        }

        const cacheKey = accessToken.substring(0, 30); // Longer cache key
        if (useCache && this.tokenValidationCache.has(cacheKey)) {
            const cached = this.tokenValidationCache.get(cacheKey)!;
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                console.log('Using cached token validation result');
                return cached.result;
            }
        }

        try {
            console.log('Validating token:', accessToken.substring(0, 20) + '...');
            const tokenInfo = await this.getTokenInfo(accessToken);

            const expiresIn = parseInt(tokenInfo.expires_in || '0');
            const expiresAt = Date.now() + (expiresIn * 1000);
            const isExpired = expiresIn <= 300; // Consider expired if less than 5 minutes

            console.log('Token expiry info:', {
                expires_in: expiresIn,
                expires_at: new Date(expiresAt).toISOString(),
                is_expired: isExpired
            });

            const grantedScopes = (tokenInfo.scope || '').split(' ').filter(Boolean);
            const hasRequiredScopes = this.REQUIRED_SCOPES.every(scope =>
                grantedScopes.includes(scope)
            );

            console.log('Token scope validation:', {
                granted: grantedScopes,
                required: this.REQUIRED_SCOPES,
                hasRequired: hasRequiredScopes
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
                errors
            };

            if (useCache) {
                this.tokenValidationCache.set(cacheKey, { result, timestamp: Date.now() });
            }

            console.log('Token validation result:', result);
            return result;

        } catch (error) {
            console.error('Token validation error:', error);
            const result: TokenValidationResult = {
                isValid: false,
                isExpired: true,
                expiresAt: null,
                hasRequiredScopes: false,
                errors: [error instanceof Error ? error.message : 'Token validation failed']
            };

            if (useCache) {
                this.tokenValidationCache.set(cacheKey, { result, timestamp: Date.now() });
            }

            return result;
        }
    }

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

    // ========== LOGOUT ==========

    async logout(): Promise<void> {
        this.updateState({ loading: true, error: null });

        try {
            console.log('Starting logout...');
            await this.performFullOAuthReset();

            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });

            // Reset failure counters
            this.consecutiveFailures = 0;
            this.authInProgress = false;
            this.reauthInProgress = false;

            console.log('Logout completed');

        } catch (error) {
            console.error('Logout error:', error);
            // Still clear state even if cleanup fails
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });
        }
    }

    // ========== CLEANUP METHODS ==========

    private async performFullOAuthReset(): Promise<void> {
        console.log('Performing full OAuth reset...');

        try {
            // Revoke current token
            const currentToken = this.getCurrentToken();
            if (currentToken) {
                await this.revokeToken(currentToken);
            }

            // Clear all Chrome identity caches
            await this.clearAllCachedTokens();

            // Clear local caches
            await this.clearCachedUser();
            this.tokenValidationCache.clear();
            this.permissionCache = null;

            // Clear extension storage
            if (chrome.storage?.local) {
                await new Promise<void>((resolve) => {
                    chrome.storage.local.clear(() => {
                        console.log('Extension storage cleared');
                        resolve();
                    });
                });
            }

        } catch (error) {
            console.warn('OAuth reset encountered errors:', error);
        }
    }

    private async clearAllCachedTokens(): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.clearAllCachedAuthTokens(() => {
                if (chrome.runtime.lastError) {
                    console.warn('Error clearing cached tokens:', chrome.runtime.lastError.message);
                } else {
                    console.log('All cached tokens cleared');
                }
                resolve();
            });
        });
    }

    private checkManifestPermissions(): boolean {
        try {
            const manifest = chrome.runtime.getManifest();
            const requiredScopes = [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/spreadsheets'
            ];

            const oauth2Scopes = manifest.oauth2?.scopes || [];
            const hasRequiredScopes = requiredScopes.every(scope =>
                oauth2Scopes.includes(scope)
            );

            if (!hasRequiredScopes) {
                console.error('Missing required scopes in manifest.json');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking manifest permissions:', error);
            return false;
        }
    }

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
                console.log('Token revoked successfully');
            }
            return success;
        } catch (error) {
            console.error('Token revocation failed:', error);
            return false;
        }
    }

    // ========== USER INFO ==========

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

    // ========== CACHING ==========

    private async cacheUser(user: User): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                'flexbookmark_user': user,
                'flexbookmark_auth_timestamp': Date.now()
            }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('Failed to cache user:', chrome.runtime.lastError.message);
                }
                resolve();
            });
        });
    }

    private async getCachedUser(): Promise<User | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['flexbookmark_user', 'flexbookmark_auth_timestamp'], (result) => {
                if (chrome.runtime.lastError) {
                    console.warn('Failed to get cached user:', chrome.runtime.lastError.message);
                    resolve(null);
                    return;
                }

                if (result.flexbookmark_user && result.flexbookmark_auth_timestamp) {
                    const cacheAge = Date.now() - result.flexbookmark_auth_timestamp;
                    if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
                        resolve(result.flexbookmark_user);
                        return;
                    }
                }
                resolve(null);
            });
        });
    }

    private async clearCachedUser(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.remove(['flexbookmark_user', 'flexbookmark_auth_timestamp'], () => {
                resolve();
            });
        });
    }

    // ========== STATE GETTERS ==========

    get isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    getCurrentUser(): User | null {
        return this.authState.user;
    }

    getCurrentToken(): string | null {
        return this.authState.user?.accessToken || null;
    }

    getCurrentState(): AuthState {
        return { ...this.authState };
    }

    // ========== ERROR HANDLING ==========

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

    // ========== DEBUGGING ==========

    async runDiagnostics(): Promise<any> {
        const token = this.getCurrentToken();
        let tokenInfo = null;
        let permissions = null;

        try {
            if (token) {
                tokenInfo = await this.getTokenInfo(token);
                permissions = await this.checkAllPermissions();
            }
        } catch (error) {
            console.error('Diagnostics error:', error);
        }

        return {
            authState: this.authState,
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenInfo,
            permissions,
            consecutiveFailures: this.consecutiveFailures,
            authInProgress: this.authInProgress,
            reauthInProgress: this.reauthInProgress,
            cacheStatus: {
                tokenCache: this.tokenValidationCache.size,
                permissionCache: !!this.permissionCache
            },
            chromeIdentityAvailable: !!(chrome && chrome.identity),
            manifestOAuth: !!(chrome.runtime.getManifest().oauth2?.client_id)
        };
    }

    clearAllCaches(): void {
        this.tokenValidationCache.clear();
        this.permissionCache = null;
        console.log('All caches cleared');
    }

    // ========== TOKEN MANAGEMENT ==========

    async updateToken(newToken: string): Promise<void> {
        if (this.authState.user) {
            const updatedUser = { ...this.authState.user, accessToken: newToken };
            await this.cacheUser(updatedUser);
            this.updateState({ user: updatedUser });

            // Clear caches to force fresh validation
            this.tokenValidationCache.clear();
            this.permissionCache = null;
        }
    }
}

export default ChromeAuthManager;