// src/utils/chromeAuth.ts

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
    private readonly CACHE_TTL = 60000; // 1 minute

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
        listener(this.authState);

        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.authState));
    }

    private updateState(partial: Partial<AuthState>): void {
        this.authState = { ...this.authState, ...partial };
        this.notifyListeners();
    }

    // ========== STATE GETTERS ==========

    getCurrentState(): AuthState {
        return { ...this.authState };
    }

    get isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    getCurrentUser(): User | null {
        return this.authState.user;
    }

    getCurrentToken(): string | null {
        return this.authState.user?.accessToken || null;
    }

    // ========== INITIALIZATION ==========

    async initialize(): Promise<void> {
        this.updateState({ loading: true, error: null });

        try {
            console.log('Initializing ChromeAuthManager...');

            // Try to get cached user data
            const cachedUser = await this.getCachedUser();
            if (cachedUser) {
                console.log('Found cached user, verifying token...');

                const validation = await this.validateToken(cachedUser.accessToken);
                if (validation.isValid) {
                    console.log('Token is valid, user authenticated');
                    this.updateState({
                        isAuthenticated: true,
                        user: cachedUser,
                        loading: false
                    });
                    return;
                } else {
                    console.log('Cached token invalid, clearing cache...');
                    await this.clearCachedUser();
                }
            }

            console.log('Attempting silent authentication...');
            await this.silentLogin();

        } catch (error) {
            console.error('Auth initialization error:', error);
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: 'Failed to initialize authentication'
            });
        }
    }

    // ========== AUTHENTICATION METHODS ==========

    private async silentLogin(): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken(
                { interactive: false, scopes: this.REQUIRED_SCOPES },
                async (result: any) => {
                    if (chrome.runtime.lastError) {
                        console.log('Silent login failed:', chrome.runtime.lastError.message);
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false
                        });
                        resolve();
                        return;
                    }

                    const token = typeof result === 'string' ? result : result?.token;
                    if (!token) {
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false
                        });
                        resolve();
                        return;
                    }

                    try {
                        const user = await this.getUserInfo(token);
                        await this.cacheUser(user);
                        this.updateState({
                            isAuthenticated: true,
                            user,
                            loading: false
                        });
                        console.log('Silent login successful');
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

    async login(): Promise<User> {
        this.updateState({ loading: true, error: null });

        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken(
                {
                    interactive: true,
                    scopes: [...this.REQUIRED_SCOPES, ...this.OPTIONAL_SCOPES]
                },
                async (result: any) => {
                    if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message || 'Failed to get auth token';
                        console.error('Interactive login error:', error);
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false,
                            error
                        });
                        reject(new Error(error));
                        return;
                    }

                    const token = typeof result === 'string' ? result : result?.token;
                    if (!token) {
                        const error = 'No auth token received';
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false,
                            error
                        });
                        reject(new Error(error));
                        return;
                    }

                    try {
                        const user = await this.getUserInfo(token);
                        await this.cacheUser(user);
                        this.updateState({
                            isAuthenticated: true,
                            user,
                            loading: false,
                            error: null
                        });
                        console.log('Interactive login successful');
                        resolve(user);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Login failed';
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false,
                            error: errorMessage
                        });
                        reject(error);
                    }
                }
            );
        });
    }

    async forceReauth(): Promise<User> {
        this.updateState({ loading: true, error: null });

        try {
            console.log('Starting force re-authentication...');

            // Clear all cached tokens
            await new Promise<void>((resolve) => {
                chrome.identity.clearAllCachedAuthTokens(() => resolve());
            });

            // Clear cached user data
            await this.clearCachedUser();

            // Reset auth state
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: true,
                error: null
            });

            // Revoke current token if exists
            const currentToken = this.getCurrentToken();
            if (currentToken) {
                try {
                    await this.revokeToken(currentToken);
                } catch (error) {
                    console.warn('Token revocation failed:', error);
                }
            }

            // Clear validation cache
            this.tokenValidationCache.clear();

            // Force interactive login with consent prompt
            const user = await this.interactiveLoginWithConsent();

            // Verify permissions after re-auth
            const permissions = await this.checkAllPermissions();
            if (!permissions.allRequired) {
                throw new Error('Required permissions not granted after re-authentication');
            }

            return user;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Re-authentication failed';
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: errorMessage
            });
            throw error;
        }
    }

    private async interactiveLoginWithConsent(): Promise<User> {
        const clientId = chrome.runtime.getManifest().oauth2?.client_id;
        if (!clientId) {
            throw new Error('OAuth2 client ID not found in manifest');
        }

        const allScopes = [...this.REQUIRED_SCOPES, ...this.OPTIONAL_SCOPES];
        const authUrl = this.buildOAuthUrl(clientId, allScopes, { prompt: 'consent' });

        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
                {
                    url: authUrl,
                    interactive: true
                },
                async (responseUrl) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message || 'Web auth flow failed'));
                        return;
                    }

                    if (!responseUrl) {
                        reject(new Error('No response URL from auth flow'));
                        return;
                    }

                    try {
                        const code = this.extractAuthCode(responseUrl);
                        const token = await this.exchangeCodeForToken(code, clientId);
                        const user = await this.getUserInfo(token);

                        await this.cacheUser(user);
                        this.updateState({
                            isAuthenticated: true,
                            user,
                            loading: false,
                            error: null
                        });

                        resolve(user);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }

    async logout(): Promise<void> {
        this.updateState({ loading: true, error: null });

        try {
            const currentUser = this.authState.user;
            if (currentUser?.accessToken) {
                // Revoke token
                await this.revokeToken(currentUser.accessToken);

                // Remove cached token
                await new Promise<void>((resolve) => {
                    chrome.identity.removeCachedAuthToken(
                        { token: currentUser.accessToken },
                        () => resolve()
                    );
                });
            }

            // Clear all cached tokens
            await new Promise<void>((resolve) => {
                chrome.identity.clearAllCachedAuthTokens(() => resolve());
            });

            // Clear cached user data and validation cache
            await this.clearCachedUser();
            this.tokenValidationCache.clear();

            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });

            console.log('Logout completed successfully');
        } catch (error) {
            console.error('Logout error:', error);
            this.updateState({
                loading: false,
                error: 'Failed to logout'
            });
            throw error;
        }
    }

    // ========== TOKEN MANAGEMENT ==========

    async validateToken(accessToken: string, useCache: boolean = true): Promise<TokenValidationResult> {
        if (!accessToken) {
            return {
                isValid: false,
                isExpired: true,
                expiresAt: null,
                hasRequiredScopes: false,
                errors: ['No access token provided']
            };
        }

        // Check cache
        const cacheKey = accessToken.substring(0, 20);
        if (useCache && this.tokenValidationCache.has(cacheKey)) {
            const cached = this.tokenValidationCache.get(cacheKey)!;
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.result;
            }
        }

        try {
            const tokenInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (!tokenInfoResponse.ok) {
                const result: TokenValidationResult = {
                    isValid: false,
                    isExpired: tokenInfoResponse.status === 400,
                    expiresAt: null,
                    hasRequiredScopes: false,
                    errors: [`Token validation failed: ${tokenInfoResponse.status}`]
                };

                if (useCache) {
                    this.tokenValidationCache.set(cacheKey, { result, timestamp: Date.now() });
                }

                return result;
            }

            const tokenInfo = await tokenInfoResponse.json();
            const expiresIn = parseInt(tokenInfo.expires_in || '0');
            const expiresAt = Date.now() + (expiresIn * 1000);
            const isExpired = expiresIn <= 60; // Consider expired if less than 1 minute

            const grantedScopes = (tokenInfo.scope || '').split(' ').filter(Boolean);
            const hasRequiredScopes = this.REQUIRED_SCOPES.every(scope =>
                grantedScopes.includes(scope)
            );

            const errors: string[] = [];
            if (isExpired) errors.push('Token expired or expiring soon');
            if (!hasRequiredScopes) errors.push('Missing required scopes');

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

            return result;

        } catch (error) {
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

    async refreshToken(): Promise<string> {
        if (!this.authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        const currentToken = this.getCurrentToken();
        if (currentToken) {
            await new Promise<void>((resolve) => {
                chrome.identity.removeCachedAuthToken({ token: currentToken }, () => resolve());
            });
        }

        const user = await this.login();
        return user.accessToken;
    }

    async updateToken(newToken: string): Promise<void> {
        if (!this.authState.user) {
            throw new Error('No authenticated user to update token for');
        }

        const updatedUser = { ...this.authState.user, accessToken: newToken };
        await this.cacheUser(updatedUser);
        this.updateState({ user: updatedUser });
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

    // ========== PERMISSION CHECKING ==========

    async checkAllPermissions(): Promise<PermissionCheckResult> {
        const token = this.getCurrentToken();
        if (!token) {
            return {
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false,
                folderStructureExists: false
            };
        }

        try {
            // Check token scopes
            const tokenInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
            );

            if (!tokenInfoResponse.ok) {
                return {
                    hasDrive: false,
                    hasSheets: false,
                    hasCalendar: false,
                    allRequired: false,
                    folderStructureExists: false
                };
            }

            const tokenInfo = await tokenInfoResponse.json();
            const scopes = tokenInfo.scope || '';

            const hasDrive = scopes.includes('https://www.googleapis.com/auth/drive.file') ||
                scopes.includes('https://www.googleapis.com/auth/drive');
            const hasSheets = scopes.includes('https://www.googleapis.com/auth/spreadsheets');
            const hasCalendar = scopes.includes('https://www.googleapis.com/auth/calendar');

            // Test API access
            const [driveAccess, sheetsAccess] = await Promise.all([
                this.testDriveAccess(token),
                this.testSheetsAccess(token)
            ]);

            // Check folder structure if we have drive access
            let folderStructureExists = false;
            if (hasDrive && driveAccess) {
                folderStructureExists = await this.checkFolderStructure(token);
            }

            return {
                hasDrive: hasDrive && driveAccess,
                hasSheets: hasSheets && sheetsAccess,
                hasCalendar,
                allRequired: hasDrive && driveAccess && hasSheets && sheetsAccess,
                folderStructureExists
            };

        } catch (error) {
            console.error('Error checking permissions:', error);
            return {
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false,
                folderStructureExists: false
            };
        }
    }

    private async testDriveAccess(token: string): Promise<boolean> {
        try {
            const response = await fetch(
                'https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)',
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return response.ok;
        } catch {
            return false;
        }
    }

    private async testSheetsAccess(token: string): Promise<boolean> {
        try {
            const response = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets?pageSize=1',
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return response.ok || response.status === 400; // 400 is expected for invalid spreadsheet ID
        } catch {
            return false;
        }
    }

    private async checkFolderStructure(token: string): Promise<boolean> {
        try {
            const query = `name='FlexBookmark' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) return false;

            const data = await response.json();
            return data.files && data.files.length > 0;
        } catch {
            return false;
        }
    }

    // ========== UTILITY METHODS ==========

    private async getUserInfo(token: string): Promise<User> {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

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
    }

    private buildOAuthUrl(clientId: string, scopes: string[], options: { prompt?: string } = {}): string {
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: chrome.identity.getRedirectURL(),
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: options.prompt || 'select_account'
        });

        return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
    }

    private extractAuthCode(responseUrl: string): string {
        const url = new URL(responseUrl);
        const code = url.searchParams.get('code');
        if (!code) {
            throw new Error('No authorization code in response');
        }
        return code;
    }

    private async exchangeCodeForToken(code: string, clientId: string): Promise<string> {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                redirect_uri: chrome.identity.getRedirectURL(),
                grant_type: 'authorization_code'
            }).toString()
        });

        if (!response.ok) {
            throw new Error(`Failed to exchange code for token: ${response.status}`);
        }

        const data = await response.json();
        return data.access_token;
    }

    // ========== CACHING METHODS ==========

    private async cacheUser(user: User): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                'flexbookmark_user': user,
                'flexbookmark_auth_timestamp': Date.now()
            }, () => resolve());
        });
    }

    private async getCachedUser(): Promise<User | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['flexbookmark_user', 'flexbookmark_auth_timestamp'], (result) => {
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
            chrome.storage.local.remove(['flexbookmark_user', 'flexbookmark_auth_timestamp'], () => resolve());
        });
    }

    // ========== DEBUG METHODS ==========

    getDebugInfo(): any {
        return {
            authState: this.authState,
            cacheSize: this.tokenValidationCache.size,
            requiredScopes: this.REQUIRED_SCOPES,
            optionalScopes: this.OPTIONAL_SCOPES
        };
    }

    clearAllCaches(): void {
        this.tokenValidationCache.clear();
        console.log('All caches cleared');
    }
}

export default ChromeAuthManager;