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
            const grantedScopes = tokenInfo.scope?.split(' ') || [];
            const expiresAt = tokenInfo.expires_in ? Date.now() + (tokenInfo.expires_in * 1000) : null;
            const hasRequiredScopes = SERVICE_SCOPES.CORE.every(scope => grantedScopes.includes(scope));

            return {
                isValid: true,
                isExpired: false,
                expiresAt,
                hasRequiredScopes,
                grantedScopes,
                errors: []
            };
        } catch (error) {
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
                        error: null // Don't show error on initial load
                    });
                    return;
                }

                // Check if we have all required permissions
                const permissionCheck = await this.getPermissionStatus();
                if (!permissionCheck.hasRequiredScopes ||
                    !permissionCheck.hasDriveAccess ||
                    !permissionCheck.hasSheetsAccess ||
                    !permissionCheck.hasCalendarAccess) {
                    console.log('Missing required permissions, clearing cache');
                    await this.clearAllCachedTokens();
                    this.updateState({
                        loading: false,
                        error: null
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
                this.updateState({ loading: false });
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

            // Request token with all scopes interactively
            const token = await this.getToken(true, SERVICE_SCOPES.ALL_SCOPES);
            console.log('Got token:', token ? 'success' : 'failed');

            if (token) {
                // Validate token
                const validation = await this.validateToken(token);
                console.log('Token validation:', validation);

                if (!validation.isValid || validation.isExpired) {
                    throw new Error('Invalid or expired token received');
                }

                // Double check permissions
                const permissionCheck = await this.getPermissionStatus();
                console.log('Permission check:', permissionCheck);

                const user = await this.getUserInfo(token);
                this.updateState({
                    isAuthenticated: true,
                    user: { ...user, accessToken: token },
                    loading: false,
                    error: null
                });
                return true;
            }

            this.updateState({
                loading: false,
                error: "Failed to get authentication token"
            });
            return false;
        } catch (error) {
            console.error("Login failed:", error);
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Login failed'
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
                        console.error('Token error:', chrome.runtime.lastError);
                        resolve(null);
                    } else if (!token) {
                        console.warn('No token received');
                        resolve(null);
                    } else {
                        console.log('Token received successfully');
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

            return requiredScopes.every(scope => validation.grantedScopes.includes(scope));
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

            allRequiredScopes.forEach(scope => {
                scopeDetails.push({
                    scope,
                    granted: grantedScopes.includes(scope),
                    tested: true
                });
            });

            const hasDriveAccess = SERVICE_SCOPES.DRIVE.every(scope => grantedScopes.includes(scope));
            const hasSheetsAccess = SERVICE_SCOPES.SHEETS.every(scope => grantedScopes.includes(scope));
            const hasCalendarAccess = SERVICE_SCOPES.CALENDAR.every(scope => grantedScopes.includes(scope));
            const hasRequiredScopes = SERVICE_SCOPES.CORE.every(scope => grantedScopes.includes(scope));

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

    async handleApiError(error: any): Promise<boolean> {
        if (error?.status === 401 || error?.message?.includes('401') ||
            error?.message?.includes('UNAUTHORIZED') ||
            error?.message?.includes('OAuth2 not granted')) {

            console.log('API authentication error detected, clearing tokens');
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
}

export default ChromeAuthManager;