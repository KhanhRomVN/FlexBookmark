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

    // NEW: Force re-authentication with full scopes
    async forceReauth(): Promise<User> {
        this.updateState({ loading: true, error: null });

        try {
            // Clear all cached tokens first
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

            // Force interactive login to get new token with full scopes
            const user = await this.login();
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

    // NEW: Check if current token has calendar write permissions
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

    // Initialize - check for existing token
    async initialize(): Promise<void> {
        this.updateState({ loading: true, error: null });

        try {
            // Try to get cached user data
            const cachedUser = await this.getCachedUser();
            if (cachedUser) {
                // Verify token is still valid
                const isValid = await this.verifyToken(cachedUser.accessToken);
                if (isValid) {
                    this.updateState({
                        isAuthenticated: true,
                        user: cachedUser,
                        loading: false
                    });

                    // Check if we have calendar write permissions
                    const hasWritePermission = await this.hasCalendarWritePermission();
                    if (!hasWritePermission) {
                        console.warn('Current token lacks calendar write permissions. Re-authentication may be needed.');
                    }

                    return;
                } else {
                    // Token expired, clear cache
                    await this.clearCachedUser();
                }
            }

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