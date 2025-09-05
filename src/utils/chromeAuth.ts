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
    // 🧑‍💼 Core user info (luôn cần thiết)
    CORE: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ] as string[],

    // 📁 Drive service (HabitManager, TaskManager)
    DRIVE: [
        'https://www.googleapis.com/auth/drive.file'
    ] as string[],

    // 📊 Sheets service (HabitManager, TaskManager) 
    SHEETS: [
        'https://www.googleapis.com/auth/spreadsheets'
    ] as string[],

    // 📅 Calendar service (CalendarManager)
    CALENDAR: [
        'https://www.googleapis.com/auth/calendar'
    ] as string[],

    // All required scopes for HabitManager
    HABIT_MANAGER: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets'
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

            // Try to get token silently with all required scopes
            const token = await this.getToken(false, SERVICE_SCOPES.HABIT_MANAGER);
            if (token) {
                const user = await this.getUserInfo(token);
                this.updateState({
                    isAuthenticated: true,
                    user: { ...user, accessToken: token },
                    loading: false
                });
            } else {
                this.updateState({ loading: false });
            }
        } catch (error) {
            this.updateState({
                loading: false,
                error: error instanceof Error ? error.message : 'Initialization failed'
            });
        }
    }

    async login(): Promise<boolean> {
        this.updateState({ loading: true, error: null });
        try {
            const token = await this.getToken(true, SERVICE_SCOPES.HABIT_MANAGER);
            if (!token) {
                throw new Error('No token received');
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

    private async getToken(interactive: boolean, scopes: string[] = SERVICE_SCOPES.CORE): Promise<string | null> {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken(
                { interactive, scopes },
                (token: string | undefined) => {
                    if (chrome.runtime.lastError || !token) {
                        console.error('Token error:', chrome.runtime.lastError);
                        resolve(null);
                    } else {
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
        if (!response.ok) throw new Error('Failed to get user info');
        return await response.json();
    }

    private async revokeToken(token: string): Promise<boolean> {
        try {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
            return true;
        } catch {
            return false;
        }
    }

    private async clearAllCachedTokens(): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.clearAllCachedAuthTokens(resolve);
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

    // New method to check if token has required scopes
    async hasRequiredScopes(requiredScopes: string[]): Promise<boolean> {
        const token = this.getCurrentToken();
        if (!token) return false;

        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return false;

            const tokenInfo = await response.json();
            const grantedScopes = tokenInfo.scope?.split(' ') || [];

            return requiredScopes.every(scope => grantedScopes.includes(scope));
        } catch {
            return false;
        }
    }
}

export default ChromeAuthManager;