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

export const SERVICE_SCOPES = {
    CORE: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
    ] as string[],
    DRIVE: [
        'https://www.googleapis.com/auth/drive.file'
    ] as string[],
    SHEETS: [
        'https://www.googleapis.com/auth/spreadsheets'
    ] as string[],
    CALENDAR: [
        'https://www.googleapis.com/auth/calendar',
    ] as string[],
    TASKS: [
        'https://www.googleapis.com/auth/tasks'
    ] as string[],
    ALL_SCOPES: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks'
    ] as string[]
} as const;

class ChromeAuthManager {
    private static instance: ChromeAuthManager;
    private authState: AuthState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
    };
    private listeners: ((state: AuthState) => void)[] = [];

    static getInstance(): ChromeAuthManager {
        if (!ChromeAuthManager.instance) {
            ChromeAuthManager.instance = new ChromeAuthManager();
        }
        return ChromeAuthManager.instance;
    }

    subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.push(listener);
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

    async validateToken(token: string): Promise<TokenValidationResult> {
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);

            if (!response.ok) {
                console.error('Token validation failed:', response.status, response.statusText);
                return {
                    isValid: false,
                    isExpired: response.status === 401,
                    expiresAt: null,
                    hasRequiredScopes: false,
                    grantedScopes: [],
                    errors: [`Token validation failed with status ${response.status}`]
                };
            }

            const tokenInfo = await response.json();
            console.log('Token info received:', tokenInfo);

            const grantedScopes = tokenInfo.scope?.split(' ') || [];
            const expiresAt = tokenInfo.expires_in ? Date.now() + (tokenInfo.expires_in * 1000) : null;

            // Check if we have all required core scopes
            const hasRequiredScopes = SERVICE_SCOPES.CORE.every(scope => {
                // Check both full URL and shortened version
                return grantedScopes.includes(scope) ||
                    grantedScopes.includes(scope.replace('https://www.googleapis.com/auth/', '')) ||
                    grantedScopes.includes(scope.replace('https://www.googleapis.com/auth/userinfo.', ''));
            });

            console.log('Granted scopes:', grantedScopes);
            console.log('Required scopes check:', hasRequiredScopes);

            return {
                isValid: true,
                isExpired: false,
                expiresAt,
                hasRequiredScopes,
                grantedScopes,
                errors: []
            };
        } catch (error) {
            console.error('Token validation error:', error);
            return {
                isValid: false,
                isExpired: false,
                expiresAt: null,
                hasRequiredScopes: false,
                grantedScopes: [],
                errors: [error instanceof Error ? error.message : 'Unknown validation error']
            };
        }
    }

    async initialize(): Promise<void> {
        this.updateState({ loading: true, error: null });
        try {
            if (!chrome?.identity) {
                throw new Error('Chrome Identity API not available');
            }

            const manifest = chrome.runtime.getManifest();
            if (!manifest.oauth2?.client_id) {
                throw new Error('OAuth2 client_id not configured in manifest');
            }

            console.log('Initializing authentication...');

            // Try to get token silently first
            const token = await this.getToken(false, SERVICE_SCOPES.ALL_SCOPES);
            if (token) {
                console.log('Got token silently, validating...');
                const validation = await this.validateToken(token);

                if (!validation.isValid || validation.isExpired) {
                    console.log('Token invalid or expired, clearing cache');
                    await this.clearAllCachedTokens();
                    this.updateState({
                        loading: false,
                        error: null
                    });
                    return;
                }

                // Check if we have all required permissions
                const permissionCheck = await this.getPermissionStatus();
                if (!permissionCheck.hasRequiredScopes) {
                    console.log('Missing required core permissions');
                    this.updateState({
                        isAuthenticated: false,
                        user: null,
                        loading: false,
                        error: 'Missing required permissions. Please re-authenticate.'
                    });
                    return;
                }

                const user = await this.getUserInfo(token);
                this.updateState({
                    isAuthenticated: true,
                    user: { ...user, accessToken: token },
                    loading: false,
                    error: null
                });
            } else {
                console.log('No token available, user needs to login');
                this.updateState({
                    loading: false,
                    isAuthenticated: false,
                    user: null,
                    error: null
                });
            }
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Initialization failed'
            });
        }
    }

    async login(): Promise<boolean> {
        console.log('Starting login process...');
        this.updateState({ loading: true, error: null });

        try {
            // Clear all cached tokens first
            await this.clearAllCachedTokens();
            console.log('Cleared cached tokens');

            // Try step-by-step authentication
            console.log('Step 1: Testing basic OAuth configuration...');

            // First verify basic OAuth is working
            const basicToken = await this.getToken(true, SERVICE_SCOPES.CORE);

            if (!basicToken) {
                throw new Error(
                    'Failed to authenticate with basic scopes. ' +
                    'Please check your OAuth configuration in Google Cloud Console:\n' +
                    '1. Verify OAuth consent screen is configured\n' +
                    '2. Add your email as a test user if app is in testing mode\n' +
                    '3. Ensure basic scopes are added to consent screen'
                );
            }

            console.log('Step 2: Basic authentication successful, requesting full permissions...');

            // Clear the basic token and request full scopes
            await this.clearAllCachedTokens();

            // Now request all scopes
            const token = await this.getToken(true, SERVICE_SCOPES.ALL_SCOPES);
            console.log('Full scope authentication result:', token ? 'success' : 'failed');

            if (token) {
                // Validate the full token
                const validation = await this.validateToken(token);
                console.log('Token validation result:', validation);

                if (!validation.isValid || validation.isExpired) {
                    throw new Error('Received invalid or expired token');
                }

                // Check permissions in detail
                const permissionCheck = await this.getPermissionStatus();
                console.log('Permission check result:', permissionCheck);

                if (!validation.hasRequiredScopes) {
                    console.warn('Missing core required scopes');
                    throw new Error(
                        'Missing required permissions. Please ensure these scopes are added to your Google Cloud Console OAuth consent screen:\n' +
                        SERVICE_SCOPES.CORE.join('\n')
                    );
                }

                const user = await this.getUserInfo(token);
                this.updateState({
                    isAuthenticated: true,
                    user: { ...user, accessToken: token },
                    loading: false,
                    error: null
                });

                // Log successful authentication details
                console.log('Authentication successful!');
                console.log('Available permissions:', {
                    drive: permissionCheck.hasDriveAccess,
                    sheets: permissionCheck.hasSheetsAccess,
                    calendar: permissionCheck.hasCalendarAccess
                });

                return true;
            }

            throw new Error(
                'Failed to get authentication token. Common causes:\n' +
                '1. Required scopes not added to OAuth consent screen\n' +
                '2. APIs not enabled in Google Cloud Console\n' +
                '3. App not published or user not added as test user'
            );

        } catch (error) {
            console.error("Login failed:", error);

            // Provide detailed error messages
            let errorMessage = 'Login failed';
            if (error instanceof Error) {
                if (error.message.includes('OAuth2 not granted') || error.message.includes('access_denied')) {
                    errorMessage =
                        'OAuth access denied. Please check Google Cloud Console:\n' +
                        '1. Add all required scopes to OAuth consent screen\n' +
                        '2. Enable required APIs (Calendar, Drive, Sheets, Tasks)\n' +
                        '3. Add your email as test user if app is in testing mode';
                } else if (error.message.includes('popup_closed_by_user')) {
                    errorMessage = 'Login was cancelled. Please try again and complete the authorization process.';
                } else {
                    errorMessage = error.message;
                }
            }

            this.updateState({
                loading: false,
                error: errorMessage
            });
            return false;
        }
    }

    async logout(): Promise<void> {
        const token = this.getCurrentToken();
        if (token) {
            await this.revokeToken(token);
        }
        await this.clearAllCachedTokens();
        this.updateState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null
        });
    }

    private async getToken(interactive: boolean, scopes: string[] = SERVICE_SCOPES.ALL_SCOPES): Promise<string | null> {
        return new Promise((resolve) => {
            console.log(`Getting token - interactive: ${interactive}, scopes:`, scopes);

            chrome.identity.getAuthToken(
                {
                    interactive,
                    scopes
                },
                (token: string | undefined) => {
                    if (chrome.runtime.lastError) {
                        console.error('Chrome identity error:', chrome.runtime.lastError);

                        const error = chrome.runtime.lastError.message || '';
                        if (error.includes('OAuth2 not granted') || error.includes('access_denied')) {
                            console.error('❌ OAuth2 scopes not granted. Check Google Cloud Console configuration:');
                            console.error('1. Go to APIs & Services > OAuth consent screen');
                            console.error('2. Add these scopes:', scopes);
                            console.error('3. Enable required APIs: Calendar, Drive, Sheets, Tasks');
                        } else if (error.includes('popup_closed_by_user')) {
                            console.error('❌ User closed the authentication popup');
                        }

                        resolve(null);
                    } else if (!token) {
                        console.warn('⚠️ No token received from Chrome identity API');
                        resolve(null);
                    } else {
                        console.log('✅ Token received successfully, length:', token.length);
                        resolve(token);
                    }
                }
            );
        });
    }

    private async getUserInfo(token: string): Promise<Omit<User, 'accessToken'>> {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get user info: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    private async revokeToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
                method: 'POST'
            });
            return response.ok;
        } catch (error) {
            console.error('Token revocation failed:', error);
            return false;
        }
    }

    async clearAllCachedTokens(): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.clearAllCachedAuthTokens(() => {
                if (chrome.runtime.lastError) {
                    console.error('Clear tokens error:', chrome.runtime.lastError);
                }
                console.log('All cached tokens cleared');
                resolve();
            });
        });
    }

    getCurrentToken(): string | null {
        return this.authState.user?.accessToken || null;
    }

    getCurrentUser(): User | null {
        return this.authState.user;
    }

    get isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    getCurrentState(): AuthState {
        return { ...this.authState };
    }

    async hasRequiredScopes(requiredScopes: string[]): Promise<boolean> {
        const token = this.getCurrentToken();
        if (!token) return false;

        try {
            const validation = await this.validateToken(token);
            if (!validation.isValid) return false;

            return requiredScopes.every(scope =>
                validation.grantedScopes.includes(scope) ||
                validation.grantedScopes.includes(scope.replace('https://www.googleapis.com/auth/', ''))
            );
        } catch {
            return false;
        }
    }

    async hasCalendarWritePermission(): Promise<boolean> {
        return this.hasRequiredScopes(SERVICE_SCOPES.CALENDAR);
    }

    async forceReauth(): Promise<string | null> {
        await this.clearAllCachedTokens();
        return this.getToken(true, SERVICE_SCOPES.ALL_SCOPES);
    }

    async reauthWithAllPermissions(): Promise<boolean> {
        this.updateState({ loading: true, error: null });
        try {
            const token = await this.forceReauth();
            if (!token) {
                throw new Error('No token received during reauth');
            }

            const validation = await this.validateToken(token);
            if (!validation.isValid) {
                throw new Error('Invalid token received during reauth');
            }

            const user = await this.getUserInfo(token);
            this.updateState({
                isAuthenticated: true,
                user: { ...user, accessToken: token },
                loading: false,
                error: null
            });
            return true;
        } catch (error) {
            console.error('Reauth error:', error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Reauth failed'
            });
            return false;
        }
    }

    async getPermissionStatus(): Promise<PermissionCheckResult> {
        const token = this.getCurrentToken();
        if (!token) {
            return {
                hasRequiredScopes: false,
                hasDriveAccess: false,
                hasSheetsAccess: false,
                hasCalendarAccess: false,
                scopeDetails: [],
                lastChecked: Date.now()
            };
        }

        try {
            const validation = await this.validateToken(token);
            if (!validation.isValid) {
                throw new Error('Token validation failed');
            }

            const grantedScopes = validation.grantedScopes;
            const scopeDetails: ScopePermissionResult[] = [];
            const allRequiredScopes = SERVICE_SCOPES.ALL_SCOPES;

            // Check each scope individually
            allRequiredScopes.forEach(scope => {
                const isGranted = this.checkScopeGranted(scope, grantedScopes);

                scopeDetails.push({
                    scope,
                    granted: isGranted,
                    tested: true
                });
            });

            // Check service-specific access
            const hasDriveAccess = SERVICE_SCOPES.DRIVE.every(scope =>
                this.checkScopeGranted(scope, grantedScopes)
            );

            const hasSheetsAccess = SERVICE_SCOPES.SHEETS.every(scope =>
                this.checkScopeGranted(scope, grantedScopes)
            );

            const hasCalendarAccess = SERVICE_SCOPES.CALENDAR.every(scope =>
                this.checkScopeGranted(scope, grantedScopes)
            );

            const hasRequiredScopes = SERVICE_SCOPES.CORE.every(scope =>
                this.checkScopeGranted(scope, grantedScopes)
            );

            console.log('📊 Permission Status Summary:');
            console.log('- Core scopes:', hasRequiredScopes);
            console.log('- Drive access:', hasDriveAccess);
            console.log('- Sheets access:', hasSheetsAccess);
            console.log('- Calendar access:', hasCalendarAccess);
            console.log('- Total granted scopes:', grantedScopes.length);

            return {
                hasRequiredScopes,
                hasDriveAccess,
                hasSheetsAccess,
                hasCalendarAccess,
                scopeDetails,
                lastChecked: Date.now()
            };
        } catch (error) {
            console.error('Permission check error:', error);
            const allRequiredScopes = SERVICE_SCOPES.ALL_SCOPES;
            return {
                hasRequiredScopes: false,
                hasDriveAccess: false,
                hasSheetsAccess: false,
                hasCalendarAccess: false,
                scopeDetails: allRequiredScopes.map(scope => ({
                    scope,
                    granted: false,
                    tested: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })),
                lastChecked: Date.now()
            };
        }
    }

    private checkScopeGranted(scope: string, grantedScopes: string[]): boolean {
        // Check multiple variations of the scope
        return grantedScopes.includes(scope) ||
            grantedScopes.includes(scope.replace('https://www.googleapis.com/auth/', '')) ||
            grantedScopes.includes(scope.replace('https://www.googleapis.com/auth/userinfo.', ''));
    }

    async handleApiError(error: any): Promise<boolean> {
        if (error?.status === 401 ||
            error?.message?.includes('401') ||
            error?.message?.includes('UNAUTHORIZED') ||
            error?.message?.includes('OAuth2 not granted') ||
            error?.message?.includes('authentication') ||
            error?.message?.includes('permission denied')) {

            console.log('🔒 API authentication error detected, clearing tokens');
            await this.clearAllCachedTokens();
            this.updateState({
                isAuthenticated: false,
                user: null,
                error: "Authentication expired. Please log in again."
            });
            return true;
        }
        return false;
    }

    // Diagnostic method to help troubleshoot OAuth issues
    async diagnoseAuthIssues(): Promise<void> {
        console.log('🔍 Running OAuth Diagnostics...');

        // Check Chrome Identity API
        if (!chrome?.identity) {
            console.error('❌ Chrome Identity API not available');
            return;
        }
        console.log('✅ Chrome Identity API available');

        // Check manifest configuration
        const manifest = chrome.runtime.getManifest();
        if (!manifest.oauth2?.client_id) {
            console.error('❌ OAuth2 client_id not configured in manifest');
        } else {
            console.log('✅ OAuth2 client_id configured:', manifest.oauth2.client_id);
        }

        // Check required scopes in manifest
        const manifestScopes = manifest.oauth2?.scopes || [];
        console.log('📋 Manifest scopes:', manifestScopes);

        const missingScopes = SERVICE_SCOPES.ALL_SCOPES.filter(scope =>
            !manifestScopes.includes(scope)
        );

        if (missingScopes.length > 0) {
            console.warn('⚠️ Missing scopes in manifest:', missingScopes);
        }

        // Test token retrieval
        try {
            const token = await this.getToken(false, SERVICE_SCOPES.CORE);
            if (token) {
                console.log('✅ Can retrieve token silently');
                const validation = await this.validateToken(token);
                console.log('📊 Token validation:', validation);
            } else {
                console.log('ℹ️ No cached token available');
            }
        } catch (error) {
            console.error('❌ Token retrieval failed:', error);
        }
    }
}

export default ChromeAuthManager;