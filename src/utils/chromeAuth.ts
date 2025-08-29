// src/utils/chromeAuth.ts - Fixed version with proper re-authentication

// Chrome Identity API authentication - Pure Chrome Extension approach

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

    // Subscribe to auth state changes
    subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.push(listener);
        // Immediately call with current state
        listener(this.authState);

        // Return unsubscribe function
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

    // Get current auth state
    getCurrentState(): AuthState {
        return this.authState;
    }

    // IMPROVED: Force re-authentication with full scopes
    async forceReauth(): Promise<User> {
        this.updateState({ loading: true, error: null });

        try {
            console.log('Starting force re-authentication...');

            // Step 1: Clear all cached tokens first
            await new Promise<void>((resolve) => {
                chrome.identity.clearAllCachedAuthTokens(() => resolve());
            });

            // Step 2: Clear cached user data
            await this.clearCachedUser();

            // Step 3: Reset auth state
            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: true,
                error: null
            });

            // Step 4: Force revoke current token to ensure fresh consent
            const currentToken = this.getCurrentToken();
            if (currentToken) {
                try {
                    await fetch(`https://oauth2.googleapis.com/revoke?token=${currentToken}`, {
                        method: 'POST'
                    });
                    console.log('Token revoked successfully');
                } catch (revokeError) {
                    console.log('Token revoke failed (may be expected):', revokeError);
                }
            }

            // Step 5: Create a Chrome tab for OAuth consent
            // This is the key fix - we need to open the OAuth URL manually
            const user = await this.interactiveLoginWithNewTab();

            // Step 6: Verify all required permissions after login
            const [hasDrive, hasSheets, hasCalendar] = await Promise.all([
                this.hasDriveFilePermission(),
                this.hasSheetsPermission(),
                this.hasCalendarWritePermission()
            ]);

            console.log('Post-reauth permissions:', { hasDrive, hasSheets, hasCalendar });

            if (!hasDrive || !hasSheets) {
                throw new Error('Failed to obtain required permissions (Drive & Sheets) after re-authentication');
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

    // NEW: Interactive login that opens a new tab with OAuth consent
    private async interactiveLoginWithNewTab(): Promise<User> {
        return new Promise((resolve, reject) => {
            // First try the standard interactive login
            chrome.identity.getAuthToken(
                {
                    interactive: true,
                    scopes: [
                        'https://www.googleapis.com/auth/userinfo.email',
                        'https://www.googleapis.com/auth/userinfo.profile',
                        'https://www.googleapis.com/auth/drive.file',
                        'https://www.googleapis.com/auth/spreadsheets',
                        'https://www.googleapis.com/auth/calendar'
                    ]
                },
                async (result: any) => {
                    if (chrome.runtime.lastError) {
                        console.log('Standard interactive login failed, trying launchWebAuthFlow...');

                        // Fallback to manual OAuth flow
                        try {
                            const user = await this.launchWebAuthFlow();
                            resolve(user);
                        } catch (webAuthError) {
                            reject(webAuthError);
                        }
                        return;
                    }

                    // Handle both possible return formats
                    const token = typeof result === 'string' ? result : result?.token;

                    if (!token) {
                        reject(new Error('No auth token received'));
                        return;
                    }

                    try {
                        console.log('Got token from interactive login, getting user info...');
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
                        reject(error);
                    }
                }
            );
        });
    }

    // NEW: Manual OAuth flow using launchWebAuthFlow
    private async launchWebAuthFlow(): Promise<User> {
        const clientId = chrome.runtime.getManifest().oauth2?.client_id;
        if (!clientId) {
            throw new Error('OAuth2 client ID not found in manifest');
        }

        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/calendar'
        ].join(' ');

        const authUrl = `https://accounts.google.com/oauth/authorize?` +
            `client_id=${clientId}&` +
            `response_type=code&` +
            `redirect_uri=${chrome.identity.getRedirectURL()}&` +
            `scope=${encodeURIComponent(scopes)}&` +
            `access_type=offline&` +
            `prompt=consent`; // Force consent screen

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
                        // Extract authorization code from response URL
                        const url = new URL(responseUrl);
                        const code = url.searchParams.get('code');

                        if (!code) {
                            reject(new Error('No authorization code in response'));
                            return;
                        }

                        // Exchange code for token
                        const token = await this.exchangeCodeForToken(code, clientId);

                        // Get user info
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

    // NEW: Exchange authorization code for access token
    private async exchangeCodeForToken(code: string, clientId: string): Promise<string> {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                redirect_uri: chrome.identity.getRedirectURL(),
                grant_type: 'authorization_code'
            }).toString()
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const data = await response.json();
        return data.access_token;
    }

    // NEW: Check if current token has spreadsheets permissions
    async hasSheetsPermission(): Promise<boolean> {
        const token = this.getCurrentToken();
        if (!token) {
            console.log('No token available for Sheets permission check');
            return false;
        }

        try {
            console.log('Checking Sheets permissions...');

            // First, check token info for scopes
            const tokenInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
            );

            if (tokenInfoResponse.ok) {
                const tokenInfo = await tokenInfoResponse.json();
                const scopes = tokenInfo.scope || '';
                console.log('Token scopes:', scopes);

                // Check if we have spreadsheets scope
                const hasSheetsScope = scopes.includes('https://www.googleapis.com/auth/spreadsheets') ||
                    scopes.includes('https://www.googleapis.com/auth/drive');

                if (!hasSheetsScope) {
                    console.log('Sheets scope not found in token');
                    return false;
                }
            } else {
                console.log('Failed to get token info:', tokenInfoResponse.status);
                return false;
            }

            // Test actual Sheets API access - get spreadsheet metadata (lightweight call)
            const sheetsResponse = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms?includeGridData=false&fields=properties.title',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const hasAccess = sheetsResponse.ok || sheetsResponse.status === 403; // 403 means permission denied but API is accessible
            console.log('Sheets API test result:', hasAccess, sheetsResponse.status);

            if (!hasAccess && sheetsResponse.status !== 403) {
                const errorText = await sheetsResponse.text();
                console.log('Sheets API error:', errorText);
            }

            return hasAccess;

        } catch (error) {
            console.error('Error checking Sheets permissions:', error);
            return false;
        }
    }

    // IMPROVED: Check if current token has drive.file permissions
    async hasDriveFilePermission(): Promise<boolean> {
        const token = this.getCurrentToken();
        if (!token) {
            console.log('No token available for permission check');
            return false;
        }

        try {
            console.log('Checking Drive permissions...');

            // First, check token info for scopes
            const tokenInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
            );

            if (tokenInfoResponse.ok) {
                const tokenInfo = await tokenInfoResponse.json();
                const scopes = tokenInfo.scope || '';
                console.log('Token scopes:', scopes);

                // Check if we have drive.file scope
                const hasDriveScope = scopes.includes('https://www.googleapis.com/auth/drive.file') ||
                    scopes.includes('https://www.googleapis.com/auth/drive');

                if (!hasDriveScope) {
                    console.log('Drive scope not found in token');
                    return false;
                }
            } else {
                console.log('Failed to get token info:', tokenInfoResponse.status);
                return false;
            }

            // Test actual Drive API access
            const driveResponse = await fetch(
                'https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const hasAccess = driveResponse.ok;
            console.log('Drive API test result:', hasAccess, driveResponse.status);

            if (!hasAccess) {
                const errorText = await driveResponse.text();
                console.log('Drive API error:', errorText);
            }

            return hasAccess;

        } catch (error) {
            console.error('Error checking drive permissions:', error);
            return false;
        }
    }

    // Check if current token has calendar write permissions
    async hasCalendarWritePermission(): Promise<boolean> {
        const token = this.getCurrentToken();
        if (!token) return false;

        try {
            // Test calendar write permission by making a minimal API call
            const response = await fetch(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) return false;

            // Check token info for scopes
            const tokenInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
            );

            if (tokenInfoResponse.ok) {
                const tokenInfo = await tokenInfoResponse.json();
                const scopes = tokenInfo.scope || '';

                // Check if we have calendar write scope
                return scopes.includes('https://www.googleapis.com/auth/calendar') ||
                    scopes.includes('https://www.googleapis.com/auth/calendar.events');
            }

            return false;
        } catch (error) {
            console.error('Error checking calendar permissions:', error);
            return false;
        }
    }

    // NEW: Check all required permissions for HabitManager
    async hasAllHabitManagerPermissions(): Promise<{
        hasDrive: boolean;
        hasSheets: boolean;
        hasCalendar: boolean;
        allRequired: boolean;
    }> {
        const [hasDrive, hasSheets, hasCalendar] = await Promise.all([
            this.hasDriveFilePermission(),
            this.hasSheetsPermission(),
            this.hasCalendarWritePermission()
        ]);

        return {
            hasDrive,
            hasSheets,
            hasCalendar,
            allRequired: hasDrive && hasSheets // Calendar is optional for HabitManager
        };
    }

    // IMPROVED: Initialize - check for existing token
    async initialize(): Promise<void> {
        this.updateState({ loading: true, error: null });

        try {
            console.log('Initializing auth...');

            // Try to get cached user data
            const cachedUser = await this.getCachedUser();
            if (cachedUser) {
                console.log('Found cached user, verifying token...');

                // Verify token is still valid
                const isValid = await this.verifyToken(cachedUser.accessToken);
                if (isValid) {
                    console.log('Token is valid, checking permissions...');

                    this.updateState({
                        isAuthenticated: true,
                        user: cachedUser,
                        loading: false
                    });

                    // Check permissions in background
                    const permissions = await this.hasAllHabitManagerPermissions();
                    console.log('Permissions check:', permissions);

                    if (!permissions.allRequired) {
                        console.warn('Current token lacks required permissions for HabitManager. Re-authentication may be needed.');
                    }

                    return;
                } else {
                    console.log('Token expired, clearing cache...');
                    // Token expired, clear cache
                    await this.clearCachedUser();
                }
            }

            console.log('No valid cached token, attempting silent login...');
            // Try silent authentication
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

    // Silent login (non-interactive)   
    private async silentLogin(): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken(
                { interactive: false },
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

                    // Handle both possible return formats
                    const token = typeof result === 'string' ? result : result?.token;

                    if (!token) {
                        console.log('No token from silent login');
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false
                        });
                        resolve();
                        return;
                    }

                    try {
                        console.log('Got token from silent login, getting user info...');
                        const user = await this.getUserInfo(token);
                        await this.cacheUser(user);

                        this.updateState({
                            isAuthenticated: true,
                            user,
                            loading: false
                        });

                        console.log('Silent login successful');
                        resolve();
                    } catch (error) {
                        console.error('Silent login error:', error);
                        this.updateState({
                            isAuthenticated: false,
                            user: null,
                            loading: false
                        });
                        resolve();
                    }
                }
            );
        });
    }

    // Interactive login
    async login(): Promise<User> {
        this.updateState({ loading: true, error: null });

        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken(
                { interactive: true },
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

                    // Handle both possible return formats
                    const token = typeof result === 'string' ? result : result?.token;

                    if (!token) {
                        const error = 'No auth token received';
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

                    try {
                        console.log('Got token from interactive login, getting user info...');
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
                        console.error('Interactive login error:', errorMessage);
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

    // Logout
    async logout(): Promise<void> {
        this.updateState({ loading: true, error: null });

        try {
            const currentUser = this.authState.user;
            if (currentUser?.accessToken) {
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

            // Clear cached user data
            await this.clearCachedUser();

            this.updateState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Logout error:', error);
            this.updateState({
                loading: false,
                error: 'Failed to logout'
            });
            throw error;
        }
    }

    // Get user info from Google API
    private async getUserInfo(token: string): Promise<User> {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
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

    // Verify token is still valid
    private async verifyToken(token: string): Promise<boolean> {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/tokeninfo', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    // Cache user data
    private async cacheUser(user: User): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                'flexbookmark_user': user,
                'flexbookmark_auth_timestamp': Date.now()
            }, () => resolve());
        });
    }

    // Get cached user data
    private async getCachedUser(): Promise<User | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['flexbookmark_user', 'flexbookmark_auth_timestamp'], (result) => {
                if (result.flexbookmark_user && result.flexbookmark_auth_timestamp) {
                    // Check if cache is not too old (24 hours)
                    const cacheAge = Date.now() - result.flexbookmark_auth_timestamp;
                    if (cacheAge < 24 * 60 * 60 * 1000) {
                        resolve(result.flexbookmark_user);
                        return;
                    }
                }
                resolve(null);
            });
        });
    }

    // Clear cached user data
    private async clearCachedUser(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.remove(['flexbookmark_user', 'flexbookmark_auth_timestamp'], () => resolve());
        });
    }

    // Get current access token
    getCurrentToken(): string | null {
        return this.authState.user?.accessToken || null;
    }

    // Refresh token
    async refreshToken(): Promise<string> {
        if (!this.authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        const currentToken = this.getCurrentToken();
        if (currentToken) {
            // Remove old token
            await new Promise<void>((resolve) => {
                chrome.identity.removeCachedAuthToken({ token: currentToken }, () => resolve());
            });
        }

        // Get new token
        const user = await this.login();
        return user.accessToken;
    }
}

export default ChromeAuthManager;