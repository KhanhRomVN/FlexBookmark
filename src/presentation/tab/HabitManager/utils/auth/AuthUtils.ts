// src/presentation/tab/HabitManager/utils/auth/AuthUtils.ts

export type AuthError =
    | 'no_auth'
    | 'invalid_token'
    | 'token_expired'
    | 'missing_permissions'
    | 'insufficient_scope'
    | 'network_error'
    | 'permission_denied'
    | 'consent_required'
    | 'unknown_error';

export interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    hasRequiredScopes: boolean;
    expiresAt: number | null;
    errors: string[];
    scopeDetails?: TokenScopeDetails;
}

export interface TokenScopeDetails {
    grantedScopes: string[];
    requiredScopes: string[];
    missingScopes: string[];
    optionalScopes: string[];
}

export interface PermissionScope {
    name: string;
    url: string;
    required: boolean;
    testEndpoint: string;
    description: string;
    category: 'storage' | 'calendar' | 'other';
    fallbackTest?: string; // Alternative endpoint for testing
}

export interface ScopeTestResult {
    [scopeName: string]: boolean;
}

export interface ApiTestResult {
    hasAccess: boolean;
    status: number;
    error?: string;
    responseTime?: number;
}

// ========== MAIN UTILITY CLASS ==========

export class AuthUtils {
    private static readonly REQUIRED_SCOPES: PermissionScope[] = [
        {
            name: 'drive',
            url: 'https://www.googleapis.com/auth/drive.file',
            required: true,
            testEndpoint: 'https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)',
            fallbackTest: 'https://www.googleapis.com/drive/v3/about?fields=user',
            description: 'Access to Google Drive files for habit data storage',
            category: 'storage'
        },
        {
            name: 'sheets',
            url: 'https://www.googleapis.com/auth/spreadsheets',
            required: true,
            testEndpoint: 'https://sheets.googleapis.com/v4/spreadsheets?pageSize=1',
            fallbackTest: 'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
            description: 'Access to Google Sheets for habit tracking data',
            category: 'storage'
        },
        {
            name: 'calendar',
            url: 'https://www.googleapis.com/auth/calendar.events.readonly',
            required: false,
            testEndpoint: 'https://www.googleapis.com/calendar/v3/calendars/primary?fields=id',
            fallbackTest: 'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
            description: 'Read-only access to calendar events for habit scheduling',
            category: 'calendar'
        }
    ];

    private static readonly GOOGLE_APIS = {
        TOKEN_INFO: 'https://www.googleapis.com/oauth2/v1/tokeninfo',
        TOKEN_REVOKE: 'https://oauth2.googleapis.com/revoke',
        USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo',
        OAUTH_AUTHORIZE: 'https://accounts.google.com/oauth2/v2/auth'
    } as const;

    private static readonly VALIDATION_CACHE = new Map<string, { result: TokenValidationResult; timestamp: number; }>();
    private static readonly SCOPE_TEST_CACHE = new Map<string, { result: ScopeTestResult; timestamp: number; }>();
    private static readonly CACHE_TTL = 60000; // 1 minute cache
    private static readonly SCOPE_CACHE_TTL = 300000; // 5 minutes for scope tests

    // ========== TOKEN VALIDATION ==========

    static async validateToken(accessToken: string, useCache: boolean = true): Promise<TokenValidationResult> {
        if (!accessToken || typeof accessToken !== 'string') {
            return {
                isValid: false,
                isExpired: true,
                hasRequiredScopes: false,
                expiresAt: null,
                errors: ['Invalid or missing access token']
            };
        }

        // Check cache
        const cacheKey = `validation_${this.hashToken(accessToken)}`;
        if (useCache && this.VALIDATION_CACHE.has(cacheKey)) {
            const cached = this.VALIDATION_CACHE.get(cacheKey)!;
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.result;
            }
        }

        const errors: string[] = [];
        const startTime = Date.now();

        try {
            console.log('Validating access token...');

            // Get token info with timeout
            const tokenInfoResponse = await this.fetchWithTimeout(
                `${this.GOOGLE_APIS.TOKEN_INFO}?access_token=${encodeURIComponent(accessToken)}`,
                { headers: { 'Accept': 'application/json' } },
                10000
            );

            if (!tokenInfoResponse.ok) {
                const errorMessages = {
                    400: 'Access token is invalid or malformed',
                    401: 'Access token is unauthorized',
                    403: 'Access token is forbidden'
                };

                errors.push(errorMessages[tokenInfoResponse.status as keyof typeof errorMessages] ||
                    `Token validation failed with status: ${tokenInfoResponse.status}`);

                return this.cacheResult({
                    isValid: false,
                    isExpired: tokenInfoResponse.status === 400,
                    hasRequiredScopes: false,
                    expiresAt: null,
                    errors
                }, cacheKey, useCache);
            }

            const tokenInfo = await tokenInfoResponse.json();
            const expiresIn = parseInt(tokenInfo.expires_in || '0');
            const expiresAt = Date.now() + (expiresIn * 1000);
            const isExpired = expiresIn <= 60; // Consider expired if less than 1 minute

            if (isExpired) {
                errors.push('Access token has expired or will expire soon');
            }

            // Validate audience
            if (tokenInfo.aud && !this.isValidAudience(tokenInfo.aud)) {
                errors.push('Token audience validation failed');
            }

            // Analyze scopes
            const grantedScopes = (tokenInfo.scope || '').split(' ').filter(Boolean);
            const scopeAnalysis = this.analyzeScopeStatus(grantedScopes);

            if (!scopeAnalysis.hasAllRequired) {
                errors.push(`Missing required scopes: ${scopeAnalysis.missingRequired.map(url => this.getScopeNameFromUrl(url)).join(', ')}`);
            }

            // Test actual API access for required scopes
            let hasApiAccess = true;
            if (!isExpired && scopeAnalysis.hasAllRequired) {
                const quickTests = await this.testRequiredScopesQuick(accessToken);
                hasApiAccess = quickTests.drive && quickTests.sheets;

                if (!hasApiAccess) {
                    errors.push('Required API endpoints are not accessible');
                }
            }

            const result: TokenValidationResult = {
                isValid: !isExpired && scopeAnalysis.hasAllRequired && hasApiAccess,
                isExpired,
                hasRequiredScopes: scopeAnalysis.hasAllRequired && hasApiAccess,
                expiresAt: isExpired ? null : expiresAt,
                errors,
                scopeDetails: {
                    grantedScopes,
                    requiredScopes: this.getRequiredScopes(),
                    missingScopes: scopeAnalysis.missingRequired,
                    optionalScopes: this.getOptionalScopes()
                }
            };

            console.log(`Token validation completed in ${Date.now() - startTime}ms:`, {
                isValid: result.isValid,
                isExpired: result.isExpired,
                hasRequiredScopes: result.hasRequiredScopes,
                errorsCount: result.errors.length
            });

            return this.cacheResult(result, cacheKey, useCache);

        } catch (error) {
            console.error('Token validation error:', error);
            errors.push(error instanceof Error ? error.message : 'Token validation request failed');

            return this.cacheResult({
                isValid: false,
                isExpired: true,
                hasRequiredScopes: false,
                expiresAt: null,
                errors
            }, cacheKey, useCache);
        }
    }

    static async quickValidateToken(accessToken: string): Promise<boolean> {
        try {
            const result = await this.validateToken(accessToken, true);
            return result.isValid;
        } catch {
            return false;
        }
    }

    // ========== SCOPE TESTING ==========

    static async testScopeAccess(accessToken: string, scopeName: string): Promise<boolean>;
    static async testScopeAccess(accessToken: string, mode: 'quick' | 'comprehensive'): Promise<ScopeTestResult>;
    static async testScopeAccess(
        accessToken: string,
        scopeNameOrMode: string
    ): Promise<boolean | ScopeTestResult> {
        if (scopeNameOrMode === 'quick' || scopeNameOrMode === 'comprehensive') {
            return this.testAllScopes(accessToken, scopeNameOrMode === 'comprehensive');
        }

        return this.testSingleScope(accessToken, scopeNameOrMode);
    }

    private static async testSingleScope(accessToken: string, scopeName: string): Promise<boolean> {
        const scope = this.REQUIRED_SCOPES.find(s => s.name === scopeName);
        if (!scope) {
            console.warn(`Unknown scope: ${scopeName}`);
            return false;
        }

        try {
            console.log(`Testing ${scopeName} scope access...`);
            const result = await this.testApiEndpoint(accessToken, scope.testEndpoint, scope.fallbackTest);

            console.log(`${scopeName} scope test result:`, {
                hasAccess: result.hasAccess,
                status: result.status,
                responseTime: result.responseTime
            });

            return result.hasAccess;

        } catch (error) {
            console.warn(`Failed to test ${scopeName} scope:`, error);
            return false;
        }
    }

    static async testAllScopes(accessToken: string, comprehensive: boolean = false): Promise<ScopeTestResult> {
        // Check cache first
        const cacheKey = `scopes_${this.hashToken(accessToken)}_${comprehensive ? 'comp' : 'quick'}`;
        if (this.SCOPE_TEST_CACHE.has(cacheKey)) {
            const cached = this.SCOPE_TEST_CACHE.get(cacheKey)!;
            if (Date.now() - cached.timestamp < this.SCOPE_CACHE_TTL) {
                return cached.result;
            }
        }

        const results: ScopeTestResult = {};
        const startTime = Date.now();

        try {
            console.log(`Testing all scopes (${comprehensive ? 'comprehensive' : 'quick'})...`);

            // Test required scopes in parallel
            const requiredTests = this.REQUIRED_SCOPES
                .filter(scope => scope.required)
                .map(async (scope) => {
                    try {
                        const hasAccess = await this.testSingleScope(accessToken, scope.name);
                        return { [scope.name]: hasAccess };
                    } catch (error) {
                        console.warn(`Error testing ${scope.name}:`, error);
                        return { [scope.name]: false };
                    }
                });

            // Test optional scopes
            const optionalTests = this.REQUIRED_SCOPES
                .filter(scope => !scope.required)
                .map(async (scope) => {
                    try {
                        const hasAccess = await this.testSingleScope(accessToken, scope.name);
                        return { [scope.name]: hasAccess };
                    } catch (error) {
                        console.warn(`Error testing ${scope.name}:`, error);
                        return { [scope.name]: false };
                    }
                });

            // Execute tests
            const allTests = [...requiredTests, ...optionalTests];
            const testResults = await Promise.allSettled(allTests);

            testResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    Object.assign(results, result.value);
                } else {
                    console.error('Scope test failed:', result.reason);
                }
            });

            // Comprehensive testing - additional verification
            if (comprehensive) {
                await this.comprehensiveScopeVerification(accessToken, results);
            }

            console.log(`All scope testing completed in ${Date.now() - startTime}ms:`, results);

            // Cache results
            this.SCOPE_TEST_CACHE.set(cacheKey, { result: results, timestamp: Date.now() });

            return results;

        } catch (error) {
            console.error('Scope testing failed:', error);

            // Return default failed state for all scopes
            this.REQUIRED_SCOPES.forEach(scope => {
                results[scope.name] = false;
            });

            return results;
        }
    }

    private static async testRequiredScopesQuick(accessToken: string): Promise<{ drive: boolean; sheets: boolean; }> {
        try {
            const [driveResult, sheetsResult] = await Promise.all([
                this.testApiEndpoint(accessToken, 'https://www.googleapis.com/drive/v3/files?pageSize=1'),
                this.testApiEndpoint(accessToken, 'https://sheets.googleapis.com/v4/spreadsheets?pageSize=1')
            ]);

            return {
                drive: driveResult.hasAccess,
                sheets: sheetsResult.hasAccess
            };
        } catch {
            return { drive: false, sheets: false };
        }
    }

    private static async comprehensiveScopeVerification(accessToken: string, results: ScopeTestResult): Promise<void> {
        // Additional verification for critical scopes
        if (results.drive) {
            try {
                const driveUserResponse = await this.testApiEndpoint(
                    accessToken,
                    'https://www.googleapis.com/drive/v3/about?fields=user'
                );
                results.drive = results.drive && driveUserResponse.hasAccess;
            } catch {
                // Keep original result if additional test fails
            }
        }

        if (results.sheets) {
            try {
                const sheetsDiscoveryResponse = await this.testApiEndpoint(
                    accessToken,
                    'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest'
                );
                results.sheets = results.sheets && sheetsDiscoveryResponse.hasAccess;
            } catch {
                // Keep original result if additional test fails
            }
        }
    }

    // ========== API TESTING UTILITIES ==========

    private static async testApiEndpoint(accessToken: string, endpoint: string, fallbackEndpoint?: string): Promise<ApiTestResult> {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            // Success cases: 200 OK, or expected 400/403 for some endpoints
            const hasAccess = response.ok ||
                response.status === 400 || // Bad request but API accessible
                response.status === 403;   // Forbidden but scope exists

            if (hasAccess) {
                return {
                    hasAccess: true,
                    status: response.status,
                    responseTime
                };
            }

            // If primary endpoint fails and we have a fallback, try it
            if (fallbackEndpoint && response.status >= 500) {
                console.log(`Primary endpoint failed (${response.status}), trying fallback...`);
                return this.testApiEndpoint(accessToken, fallbackEndpoint);
            }

            return {
                hasAccess: false,
                status: response.status,
                error: `API test failed: ${response.status} ${response.statusText}`,
                responseTime
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;

            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    hasAccess: false,
                    status: 408,
                    error: 'Request timeout',
                    responseTime
                };
            }

            // If network error and we have a fallback, try it
            if (fallbackEndpoint) {
                console.log('Network error occurred, trying fallback endpoint...');
                return this.testApiEndpoint(accessToken, fallbackEndpoint);
            }

            return {
                hasAccess: false,
                status: 0,
                error: error instanceof Error ? error.message : 'Network error',
                responseTime
            };
        }
    }

    // ========== SCOPE MANAGEMENT ==========

    private static analyzeScopeStatus(grantedScopes: string[]): {
        hasAllRequired: boolean;
        hasOptional: boolean;
        missingRequired: string[];
        missingOptional: string[];
    } {
        const requiredScopes = this.getRequiredScopes();
        const optionalScopes = this.getOptionalScopes();

        const missingRequired = requiredScopes.filter(scope =>
            !grantedScopes.includes(scope)
        );

        const missingOptional = optionalScopes.filter(scope =>
            !grantedScopes.includes(scope)
        );

        return {
            hasAllRequired: missingRequired.length === 0,
            hasOptional: optionalScopes.every(scope => grantedScopes.includes(scope)),
            missingRequired,
            missingOptional
        };
    }

    static getMissingRequiredScopes(currentScopes: { [key: string]: boolean }): string[] {
        return this.REQUIRED_SCOPES
            .filter(scope => scope.required && !currentScopes[scope.name])
            .map(scope => scope.url);
    }

    static getRequiredScopeNames(): string[] {
        return this.REQUIRED_SCOPES
            .filter(scope => scope.required)
            .map(scope => scope.name);
    }

    // ========== TOKEN MANAGEMENT ==========

    static async revokeToken(accessToken: string): Promise<boolean> {
        try {
            const response = await this.fetchWithTimeout(
                `${this.GOOGLE_APIS.TOKEN_REVOKE}?token=${accessToken}`,
                { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
                10000
            );
            return response.ok;
        } catch (error) {
            console.error('Token revocation failed:', error);
            return false;
        }
    }

    static async getUserInfo(accessToken: string): Promise<any> {
        try {
            const response = await this.fetchWithTimeout(
                this.GOOGLE_APIS.USER_INFO,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json'
                    }
                },
                10000
            );

            if (!response.ok) {
                throw new Error(`User info request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to get user info:', error);
            throw error;
        }
    }

    static getTokenExpiryInfo(expiresAt: number | null): {
        expiresAt: number | null;
        timeUntilExpiry: number;
        minutesUntilExpiry: number;
        isExpiringSoon: boolean;
        isExpired: boolean;
    } | null {
        if (!expiresAt) return null;

        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
        const TOKEN_EXPIRY_BUFFER = 10 * 60 * 1000; // 10 minutes

        return {
            expiresAt,
            timeUntilExpiry,
            minutesUntilExpiry,
            isExpiringSoon: timeUntilExpiry <= TOKEN_EXPIRY_BUFFER,
            isExpired: timeUntilExpiry <= 0
        };
    }

    // ========== UTILITY METHODS ==========

    static getRequiredScopes(): string[] {
        return this.REQUIRED_SCOPES
            .filter(scope => scope.required)
            .map(scope => scope.url);
    }

    static getOptionalScopes(): string[] {
        return this.REQUIRED_SCOPES
            .filter(scope => !scope.required)
            .map(scope => scope.url);
    }

    static getAllScopes(): string[] {
        return this.REQUIRED_SCOPES.map(scope => scope.url);
    }

    static getScopeDetails(scopeName: string): PermissionScope | null {
        return this.REQUIRED_SCOPES.find(scope => scope.name === scopeName) || null;
    }

    static getScopeNameFromUrl(scopeUrl: string): string {
        const scope = this.REQUIRED_SCOPES.find(s => s.url === scopeUrl);
        return scope?.name || scopeUrl.split('/').pop() || 'unknown';
    }

    static getScopeUrlFromName(scopeName: string): string {
        const scope = this.REQUIRED_SCOPES.find(s => s.name === scopeName);
        return scope?.url || '';
    }

    static getAllScopeDetails(): PermissionScope[] {
        return [...this.REQUIRED_SCOPES];
    }

    static categorizeScopesByType(): { required: PermissionScope[]; optional: PermissionScope[]; } {
        return {
            required: this.REQUIRED_SCOPES.filter(scope => scope.required),
            optional: this.REQUIRED_SCOPES.filter(scope => !scope.required)
        };
    }

    // ========== NETWORK UTILITIES ==========

    private static async fetchWithTimeout(
        url: string,
        options: RequestInit = {},
        timeoutMs: number = 10000
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    static async testNetworkConnectivity(): Promise<boolean> {
        try {
            const response = await this.fetchWithTimeout('https://www.googleapis.com/', { method: 'HEAD' }, 5000);
            return response.ok;
        } catch {
            return false;
        }
    }

    // ========== CACHING UTILITIES ==========

    private static cacheResult(result: TokenValidationResult, cacheKey: string, useCache: boolean): TokenValidationResult {
        if (useCache) {
            this.VALIDATION_CACHE.set(cacheKey, { result, timestamp: Date.now() });
        }
        return result;
    }

    private static hashToken(token: string): string {
        // Simple hash for cache key (first 20 chars should be sufficient for our use case)
        return token.substring(0, 20);
    }

    static clearValidationCache(): void {
        this.VALIDATION_CACHE.clear();
        this.SCOPE_TEST_CACHE.clear();
        console.log('AuthUtils caches cleared');
    }

    static getCacheStats(): {
        validationCacheSize: number;
        scopeCacheSize: number;
        oldestValidationEntry: number | null;
        oldestScopeEntry: number | null;
    } {
        let oldestValidation: number | null = null;
        let oldestScope: number | null = null;

        this.VALIDATION_CACHE.forEach(({ timestamp }) => {
            if (!oldestValidation || timestamp < oldestValidation) {
                oldestValidation = timestamp;
            }
        });

        this.SCOPE_TEST_CACHE.forEach(({ timestamp }) => {
            if (!oldestScope || timestamp < oldestScope) {
                oldestScope = timestamp;
            }
        });

        return {
            validationCacheSize: this.VALIDATION_CACHE.size,
            scopeCacheSize: this.SCOPE_TEST_CACHE.size,
            oldestValidationEntry: oldestValidation,
            oldestScopeEntry: oldestScope
        };
    }

    static cleanupExpiredCache(): void {
        const now = Date.now();

        // Clean validation cache
        for (const [key, { timestamp }] of this.VALIDATION_CACHE.entries()) {
            if (now - timestamp > this.CACHE_TTL) {
                this.VALIDATION_CACHE.delete(key);
            }
        }

        // Clean scope test cache
        for (const [key, { timestamp }] of this.SCOPE_TEST_CACHE.entries()) {
            if (now - timestamp > this.SCOPE_CACHE_TTL) {
                this.SCOPE_TEST_CACHE.delete(key);
            }
        }

        console.log('Expired cache entries cleaned up');
    }

    // ========== VALIDATION UTILITIES ==========

    private static getClientId(): string {
        return chrome.runtime.getManifest().oauth2?.client_id || '';
    }

    private static isValidAudience(audience: string): boolean {
        const clientId = this.getClientId();
        return audience === clientId;
    }

    static generateOAuthState(): string {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0].toString(36);
    }

    // ========== DEBUG AND MONITORING ==========

    static async getComprehensiveDebugInfo(accessToken?: string): Promise<{
        scopes: PermissionScope[];
        tokenInfo: any;
        scopeTests: ScopeTestResult;
        systemHealth: any;
        cacheStats: any;
        networkStatus: boolean;
    }> {
        const debugInfo: any = {
            scopes: this.getAllScopeDetails(),
            tokenInfo: null,
            scopeTests: {},
            systemHealth: {
                chromeIdentityAvailable: !!chrome.identity,
                manifestValid: !!chrome.runtime.getManifest().oauth2,
                networkConnectivity: false,
                cacheOperational: true
            },
            cacheStats: this.getCacheStats(),
            networkStatus: false
        };

        try {
            debugInfo.networkStatus = await this.testNetworkConnectivity();
            debugInfo.systemHealth.networkConnectivity = debugInfo.networkStatus;

            if (accessToken) {
                // Get token info
                try {
                    const tokenResponse = await this.fetchWithTimeout(
                        `${this.GOOGLE_APIS.TOKEN_INFO}?access_token=${accessToken}`,
                        undefined,
                        5000
                    );
                    if (tokenResponse.ok) {
                        debugInfo.tokenInfo = await tokenResponse.json();
                    }
                } catch (error) {
                    debugInfo.tokenInfoError = error instanceof Error ? error.message : 'Token info failed';
                }

                // Test all scopes
                try {
                    debugInfo.scopeTests = await this.testAllScopes(accessToken, true);
                } catch (error) {
                    debugInfo.scopeTestError = error instanceof Error ? error.message : 'Scope tests failed';
                }
            }

        } catch (error) {
            debugInfo.debugError = error instanceof Error ? error.message : 'Debug info collection failed';
        }

        return debugInfo;
    }

    static formatScopeList(scopes: string[], includeDescriptions: boolean = false): string {
        return scopes.map(scopeUrl => {
            const scope = this.getScopeDetails(this.getScopeNameFromUrl(scopeUrl));
            if (!scope) return scopeUrl;

            let formatted = `${scope.name} (${scope.required ? 'Required' : 'Optional'})`;
            if (includeDescriptions && scope.description) {
                formatted += `\n  ${scope.description}`;
            }
            return formatted;
        }).join('\n');
    }

    // ========== PERIODIC MAINTENANCE ==========

    static startPeriodicCacheCleanup(intervalMs: number = 300000): NodeJS.Timeout {
        return setInterval(() => {
            this.cleanupExpiredCache();
        }, intervalMs);
    }
}