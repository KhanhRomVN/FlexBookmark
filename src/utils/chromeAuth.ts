export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    accessToken?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface PermissionCheckResult {
    hasRequiredScopes: boolean;
    hasDriveAccess: boolean;
    hasSheetsAccess: boolean;
    hasTasksAccess: boolean;
    error?: string;
}

type AuthStateListener = (authState: AuthState) => void;

class ChromeAuthManager {
    private static instance: ChromeAuthManager;
    private authState: AuthState = {
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    };
    private listeners: AuthStateListener[] = [];
    private isInitialized = false;

    // OAuth 2.0 scopes required by the app
    private readonly REQUIRED_SCOPES = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/spreadsheets",
    ];

    private constructor() { }

    static getInstance(): ChromeAuthManager {
        if (!ChromeAuthManager.instance) {
            ChromeAuthManager.instance = new ChromeAuthManager();
        }
        return ChromeAuthManager.instance;
    }

    subscribe(listener: AuthStateListener): () => void {
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
        this.listeners.forEach(listener => {
            try {
                listener(this.authState);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    private updateAuthState(updates: Partial<AuthState>): void {
        this.authState = { ...this.authState, ...updates };
        this.notifyListeners();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        console.log('Initializing authentication...');
        this.updateAuthState({ loading: true, error: null });

        try {
            // Check if we have a cached token
            const cachedToken = await this.getCachedToken();

            if (cachedToken) {
                console.log('Found cached token, validating...');
                await this.handleNewToken(cachedToken);
            } else {
                console.log('No cached token found');
                this.updateAuthState({
                    loading: false,
                    isAuthenticated: false,
                    user: null,
                    error: null
                });
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.updateAuthState({
                loading: false,
                error: error instanceof Error ? error.message : 'Authentication initialization failed',
                isAuthenticated: false,
                user: null
            });
        }
    }

    private async getCachedToken(): Promise<string | null> {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken(
                {
                    interactive: false,
                    scopes: this.REQUIRED_SCOPES
                },
                (token) => {
                    if (chrome.runtime.lastError) {
                        console.log('No cached token:', chrome.runtime.lastError.message);
                        resolve(null);
                    } else {
                        resolve((token as string) || null);
                    }
                }
            );
        });
    }

    async handleNewToken(token: string): Promise<void> {
        if (!token) {
            throw new Error('No token provided');
        }

        console.log('Processing new token...');

        try {
            // Get user info from Google API
            const userResponse = await fetch(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!userResponse.ok) {
                throw new Error(`Failed to get user info: ${userResponse.status}`);
            }

            const userData = await userResponse.json();

            const user: User = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                picture: userData.picture,
                accessToken: token,
            };

            // Save user to storage
            await chrome.storage.local.set({
                flexbookmark_user: user,
                flexbookmark_token: token,
            });

            console.log('Authentication successful:', user.email);

            this.updateAuthState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null,
            });

        } catch (error) {
            console.error('Error handling token:', error);

            // Clear any cached tokens on error
            await this.clearStoredAuth();

            this.updateAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Token validation failed',
            });

            throw error;
        }
    }

    async getInteractiveToken(): Promise<string> {
        console.log('Getting interactive token...');

        return new Promise((resolve, reject) => {
            // Clear any cached tokens first to force fresh login
            chrome.identity.clearAllCachedAuthTokens(() => {
                console.log('Cleared cached tokens, requesting new token...');

                chrome.identity.getAuthToken(
                    {
                        interactive: true,
                        scopes: this.REQUIRED_SCOPES,
                    },
                    (token) => {
                        if (chrome.runtime.lastError) {
                            const error = chrome.runtime.lastError.message || 'Unknown auth error';
                            console.error('Interactive token request failed:', error);
                            reject(new Error(error));
                        } else if (token) {
                            console.log('Interactive token obtained successfully');
                            resolve(token as string);
                        } else {
                            console.error('No token received from interactive request');
                            reject(new Error('No token received from Chrome identity'));
                        }
                    }
                );
            });
        });
    }

    async logout(): Promise<void> {
        console.log('Logging out...');

        try {
            // Remove cached token from Chrome
            if (this.authState.user?.accessToken) {
                await new Promise<void>((resolve) => {
                    chrome.identity.removeCachedAuthToken(
                        { token: this.authState.user!.accessToken! },
                        () => {
                            console.log('Removed cached token');
                            resolve();
                        }
                    );
                });
            }

            // Clear all cached auth tokens
            await new Promise<void>((resolve) => {
                chrome.identity.clearAllCachedAuthTokens(() => {
                    console.log('Cleared all cached tokens');
                    resolve();
                });
            });

            // Clear stored data
            await this.clearStoredAuth();

            this.updateAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            });

            console.log('Logout completed');
        } catch (error) {
            console.error('Logout error:', error);

            // Still update auth state even if cleanup fails
            this.updateAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
            });
        }
    }

    private async clearStoredAuth(): Promise<void> {
        try {
            await chrome.storage.local.remove([
                'flexbookmark_user',
                'flexbookmark_token',
            ]);
            console.log('Cleared stored auth data');
        } catch (error) {
            console.warn('Failed to clear stored auth data:', error);
        }
    }

    async getPermissionStatus(): Promise<PermissionCheckResult> {
        const token = this.authState.user?.accessToken;

        if (!token) {
            return {
                hasRequiredScopes: false,
                hasDriveAccess: false,
                hasSheetsAccess: false,
                hasTasksAccess: false,
                error: 'No access token available'
            };
        }

        try {
            // Test Tasks API access
            const tasksTest = await fetch(
                'https://www.googleapis.com/tasks/v1/users/@me/lists',
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            // Test Drive API access
            const driveTest = await fetch(
                'https://www.googleapis.com/drive/v3/about?fields=user',
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            // Test Sheets API access  
            const sheetsTest = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets',
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            const results = {
                hasTasksAccess: tasksTest.ok,
                hasDriveAccess: driveTest.ok,
                hasSheetsAccess: sheetsTest.ok || sheetsTest.status === 404,
                hasRequiredScopes: tasksTest.ok && driveTest.ok && (sheetsTest.ok || sheetsTest.status === 404),
            };

            console.log('Permission status:', results);

            return results;
        } catch (error) {
            console.error('Permission check failed:', error);
            return {
                hasRequiredScopes: false,
                hasDriveAccess: false,
                hasSheetsAccess: false,
                hasTasksAccess: false,
                error: error instanceof Error ? error.message : 'Permission check failed'
            };
        }
    }

    // Add the missing hasRequiredScopes method
    async hasRequiredScopes(scopes?: string[]): Promise<boolean> {
        try {
            const scopesToCheck = scopes || this.REQUIRED_SCOPES;
            const token = this.authState.user?.accessToken;

            if (!token) {
                console.log('No access token available for scope check');
                return false;
            }

            // If checking for Drive and Sheets access specifically
            if (scopesToCheck.includes('https://www.googleapis.com/auth/drive.file') ||
                scopesToCheck.includes('https://www.googleapis.com/auth/spreadsheets')) {

                const permissionStatus = await this.getPermissionStatus();
                return permissionStatus.hasRequiredScopes;
            }

            // For other scopes, do a simple token validation
            const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `access_token=${token}`
            });

            if (response.ok) {
                const tokenInfo = await response.json();
                const tokenScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];

                // Check if all required scopes are present
                return scopesToCheck.every(scope => tokenScopes.includes(scope));
            }

            return false;
        } catch (error) {
            console.error('Error checking required scopes:', error);
            return false;
        }
    }

    getCurrentAuthState(): AuthState {
        return { ...this.authState };
    }

    async refreshToken(): Promise<string | null> {
        try {
            console.log('Refreshing token...');

            // Try to get a fresh token non-interactively
            const token = await this.getCachedToken();

            if (token && token !== this.authState.user?.accessToken) {
                console.log('Got refreshed token');
                await this.handleNewToken(token);
                return token;
            }

            return token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    // Helper method to get a fresh token, with fallback to interactive login
    async getFreshToken(): Promise<string> {
        // If we have a current token, try to validate it first
        if (this.authState.user?.accessToken) {
            try {
                const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `access_token=${this.authState.user.accessToken}`
                });

                if (response.ok) {
                    console.log('Current token is valid');
                    return this.authState.user.accessToken;
                }
            } catch (error) {
                console.log('Token validation failed:', error);
            }
        }

        // Try to refresh non-interactively
        const refreshedToken = await this.refreshToken();
        if (refreshedToken) {
            return refreshedToken;
        }

        // Fall back to interactive login
        console.log('Falling back to interactive token request');
        const interactiveToken = await this.getInteractiveToken();
        await this.handleNewToken(interactiveToken);
        return interactiveToken;
    }
}

export default ChromeAuthManager;