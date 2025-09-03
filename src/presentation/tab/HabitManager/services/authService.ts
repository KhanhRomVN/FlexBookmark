import { AuthUtils } from '../utils/auth/AuthUtils';
import type {
    TokenInfo
} from '../types';

// 🔄 Define missing interfaces locally
interface AuthOperationResult {
    success: boolean;
    error?: string;
}

interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    hasRequiredScopes: boolean;
    expiresAt: number | null;
    errors: string[];
    scopeDetails?: {
        grantedScopes: string[];
        requiredScopes: string[];
        missingScopes: string[];
        optionalScopes: string[];
    };
}

interface TokenRefreshResult {
    success: boolean;
    tokenInfo?: TokenInfo;
    error?: string;
}

export class AuthService {
    private accessToken: string | null = null;

    /**
     * 🔑 Set access token
     */
    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    /**
     * 🔍 Get current access token
     */
    getAccessToken(): string | null {
        return this.accessToken;
    }

    /**
     * ✅ Validate authentication token
     */
    async validateToken(): Promise<TokenValidationResult> {
        if (!this.accessToken) {
            return {
                isValid: false,
                isExpired: true,
                hasRequiredScopes: false,
                expiresAt: null,
                errors: ['No access token available']
            };
        }

        return AuthUtils.validateToken(this.accessToken);
    }

    /**
     * 🔄 Refresh access token
     */
    async refreshToken(): Promise<TokenRefreshResult> {
        try {
            console.log('🔄 Refreshing access token...');

            return new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ interactive: false }, (token) => {
                    if (chrome.runtime.lastError) {
                        const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
                        reject(new Error(errorMessage));
                        return;
                    }

                    if (!token) {
                        reject(new Error('No token received'));
                        return;
                    }

                    // Convert GetAuthTokenResult to string
                    const tokenString = token.toString();
                    this.accessToken = tokenString;

                    // Create a proper TokenInfo object
                    const tokenInfo: TokenInfo = {
                        access_token: tokenString,
                        expires_in: 3600, // Default value, will be updated by validation
                        expires_at: Date.now() + 3600000, // Default 1 hour
                        token_type: 'Bearer',
                        scope: '' // Will be populated by validation
                    };

                    resolve({
                        success: true,
                        tokenInfo
                    });
                });
            });
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token refresh failed'
            };
        }
    }

    /**
     * 🚪 Logout user
     */
    async logout(): Promise<AuthOperationResult> {
        try {
            if (this.accessToken) {
                await AuthUtils.revokeToken(this.accessToken);
            }

            return new Promise((resolve) => {
                chrome.identity.clearAllCachedAuthTokens(() => {
                    this.accessToken = null;
                    resolve({ success: true });
                });
            });
        } catch (error) {
            console.error('❌ Logout failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Logout failed'
            };
        }
    }

    /**
     * 🔐 Login user
     */
    async login(): Promise<AuthOperationResult> {
        try {
            return new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ interactive: true }, (token) => {
                    if (chrome.runtime.lastError) {
                        const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
                        reject(new Error(errorMessage));
                        return;
                    }

                    if (!token) {
                        reject(new Error('No token received'));
                        return;
                    }

                    // Convert GetAuthTokenResult to string
                    const tokenString = token.toString();
                    this.accessToken = tokenString;
                    resolve({ success: true });
                });
            });
        } catch (error) {
            console.error('❌ Login failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            };
        }
    }

    /**
     * 📋 Check user permissions
     */
    async checkPermissions(): Promise<{ hasDrive: boolean; hasSheets: boolean; hasCalendar: boolean }> {
        if (!this.accessToken) {
            return { hasDrive: false, hasSheets: false, hasCalendar: false };
        }

        try {
            const scopeTests = await AuthUtils.testAllScopes(this.accessToken, false);
            return {
                hasDrive: scopeTests.drive || false,
                hasSheets: scopeTests.sheets || false,
                hasCalendar: scopeTests.calendar || false
            };
        } catch (error) {
            console.error('❌ Permission check failed:', error);
            return { hasDrive: false, hasSheets: false, hasCalendar: false };
        }
    }

    /**
     * 👤 Get user info
     */
    async getUserInfo(): Promise<any> {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        return AuthUtils.getUserInfo(this.accessToken);
    }

    /**
     * ⏰ Get token expiry info
     */
    async getTokenExpiryInfo(): Promise<{
        expiresAt: number | null;
        timeUntilExpiry: number;
        minutesUntilExpiry: number;
        isExpiringSoon: boolean;
        isExpired: boolean;
    } | null> {
        if (!this.accessToken) {
            return null;
        }

        const validation = await AuthUtils.validateToken(this.accessToken, false);
        return AuthUtils.getTokenExpiryInfo(validation.expiresAt);
    }

    /**
     * 🧪 Test API access
     */
    async testApiAccess(): Promise<boolean> {
        if (!this.accessToken) {
            return false;
        }

        try {
            const [driveResult, sheetsResult] = await Promise.all([
                this.testDriveAccess(),
                this.testSheetsAccess()
            ]);

            return driveResult && sheetsResult;
        } catch {
            return false;
        }
    }

    private async testDriveAccess(): Promise<boolean> {
        try {
            const response = await fetch(
                'https://www.googleapis.com/drive/v3/files?pageSize=1',
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return response.ok || response.status === 403;
        } catch {
            return false;
        }
    }

    private async testSheetsAccess(): Promise<boolean> {
        try {
            const response = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets?pageSize=1',
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return response.ok || response.status === 403;
        } catch {
            return false;
        }
    }
}

export default AuthService;