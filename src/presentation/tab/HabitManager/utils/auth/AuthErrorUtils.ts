// src/presentation/tab/HabitManager/utils/auth/AuthErrorUtils.ts

import { AuthUtils } from './AuthUtils';
import type { AuthError } from './AuthUtils';

export interface AuthDiagnosticResult {
    isHealthy: boolean;
    severity: 'healthy' | 'warning' | 'critical' | 'fatal';
    issues: AuthIssue[];
    recommendations: string[];
    needsUserAction: boolean;
    canAutoRecover: boolean;
    systemStatus: SystemHealthStatus;
    recoveryPlan?: RecoveryPlan;
}

export interface AuthIssue {
    type: AuthError;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    canAutoRecover: boolean;
    requiresUserAction: boolean;
    suggestedAction: string;
    technicalDetails?: string;
}

export interface SystemHealthStatus {
    tokenValid: boolean;
    scopesValid: boolean;
    networkReachable: boolean;
    authManagerHealthy: boolean;
    chromeIdentityAvailable: boolean;
    manifestConfigValid: boolean;
    cacheOperational: boolean;
}

export interface RecoveryPlan {
    steps: RecoveryStep[];
    estimatedTime: string;
    successProbability: 'high' | 'medium' | 'low';
    requiresUserInteraction: boolean;
}

export interface RecoveryStep {
    action: string;
    description: string;
    automated: boolean;
    estimatedDuration: number; // in milliseconds
}

export interface TokenRefreshConfig {
    interactive: boolean;
    timeout: number;
    retryCount: number;
    forceReauth: boolean;
    includeOptionalScopes: boolean;
}

export interface OAuthConsentResult {
    success: boolean;
    grantedScopes: string[];
    deniedScopes: string[];
    newToken?: string;
    error?: string;
}

export class AuthErrorUtils {

    private static readonly ERROR_PATTERNS = {
        NETWORK_ERRORS: ['network', 'timeout', 'fetch', 'connection', 'offline'],
        TOKEN_ERRORS: ['401', 'unauthorized', 'unauthenticated', 'invalid_token', 'token_expired'],
        SCOPE_ERRORS: ['403', 'forbidden', 'insufficient_scope', 'scope_insufficient', 'permission_denied'],
        CONSENT_ERRORS: ['consent_required', 'consent_needed', 'authorization_required'],
        RATE_LIMIT_ERRORS: ['429', 'rate_limit', 'quota_exceeded', 'too_many_requests']
    } as const;

    // ========== ERROR DETECTION ==========

    static isAuthError(error: any): boolean {
        if (!error) return false;

        const errorStr = this.errorToString(error).toLowerCase();
        const statusCode = this.extractStatusCode(error);

        // Check HTTP status codes
        if ([401, 403, 429].includes(statusCode)) return true;

        // Check error patterns
        const allPatterns = [
            ...this.ERROR_PATTERNS.TOKEN_ERRORS,
            ...this.ERROR_PATTERNS.SCOPE_ERRORS,
            ...this.ERROR_PATTERNS.CONSENT_ERRORS
        ];

        return allPatterns.some(pattern => errorStr.includes(pattern));
    }

    static classifyError(error: any): {
        category: 'network' | 'auth' | 'scope' | 'consent' | 'rate_limit' | 'unknown';
        confidence: number;
    } {
        const errorStr = this.errorToString(error).toLowerCase();
        const statusCode = this.extractStatusCode(error);

        // Network errors
        if (this.ERROR_PATTERNS.NETWORK_ERRORS.some(pattern => errorStr.includes(pattern))) {
            return { category: 'network', confidence: 0.9 };
        }

        // Rate limiting
        if (statusCode === 429 || this.ERROR_PATTERNS.RATE_LIMIT_ERRORS.some(pattern => errorStr.includes(pattern))) {
            return { category: 'rate_limit', confidence: 0.95 };
        }

        // Authentication errors
        if (statusCode === 401 || this.ERROR_PATTERNS.TOKEN_ERRORS.some(pattern => errorStr.includes(pattern))) {
            return { category: 'auth', confidence: 0.9 };
        }

        // Authorization/scope errors
        if (statusCode === 403 || this.ERROR_PATTERNS.SCOPE_ERRORS.some(pattern => errorStr.includes(pattern))) {
            return { category: 'scope', confidence: 0.85 };
        }

        // Consent errors
        if (this.ERROR_PATTERNS.CONSENT_ERRORS.some(pattern => errorStr.includes(pattern))) {
            return { category: 'consent', confidence: 0.8 };
        }

        return { category: 'unknown', confidence: 0.1 };
    }

    // ========== ERROR PARSING ==========

    static parseAuthError(error: any): AuthIssue {
        if (!error) {
            return {
                type: 'unknown_error',
                message: 'Unknown error occurred',
                severity: 'warning',
                canAutoRecover: false,
                requiresUserAction: true,
                suggestedAction: 'Try refreshing the page and signing in again'
            };
        }

        const errorStr = this.errorToString(error);
        const statusCode = this.extractStatusCode(error);
        const classification = this.classifyError(error);

        switch (classification.category) {
            case 'network':
                return {
                    type: 'network_error',
                    message: 'Network connectivity issue detected',
                    severity: 'warning',
                    canAutoRecover: true,
                    requiresUserAction: false,
                    suggestedAction: 'Check internet connection and try again',
                    technicalDetails: `Network error: ${errorStr}`
                };

            case 'auth':
                if (statusCode === 401 || errorStr.includes('unauthorized')) {
                    return {
                        type: 'invalid_token',
                        message: 'Authentication token is invalid or expired',
                        severity: 'critical',
                        canAutoRecover: true,
                        requiresUserAction: true,
                        suggestedAction: 'Please sign in again',
                        technicalDetails: `Auth error (${statusCode}): ${errorStr}`
                    };
                }

                if (errorStr.includes('expired')) {
                    return {
                        type: 'token_expired',
                        message: 'Access token has expired',
                        severity: 'critical',
                        canAutoRecover: true,
                        requiresUserAction: false,
                        suggestedAction: 'Token will be automatically refreshed',
                        technicalDetails: `Token expiry: ${errorStr}`
                    };
                }
                break;

            case 'scope':
                return {
                    type: 'insufficient_scope',
                    message: 'Insufficient permissions for this operation',
                    severity: 'critical',
                    canAutoRecover: true,
                    requiresUserAction: true,
                    suggestedAction: 'Grant additional permissions',
                    technicalDetails: `Scope error (${statusCode}): ${errorStr}`
                };

            case 'consent':
                return {
                    type: 'consent_required',
                    message: 'User consent is required for additional permissions',
                    severity: 'warning',
                    canAutoRecover: true,
                    requiresUserAction: true,
                    suggestedAction: 'Complete the permission consent flow',
                    technicalDetails: `Consent required: ${errorStr}`
                };

            case 'rate_limit':
                return {
                    type: 'network_error',
                    message: 'API rate limit exceeded',
                    severity: 'warning',
                    canAutoRecover: true,
                    requiresUserAction: false,
                    suggestedAction: 'Please wait a moment and try again',
                    technicalDetails: `Rate limit (${statusCode}): ${errorStr}`
                };
        }

        // Default case
        return {
            type: 'unknown_error',
            message: error instanceof Error ? error.message : 'Unknown authentication error',
            severity: 'warning',
            canAutoRecover: false,
            requiresUserAction: true,
            suggestedAction: 'Try signing out and signing back in',
            technicalDetails: errorStr
        };
    }

    // ========== COMPREHENSIVE DIAGNOSTICS ==========

    static async diagnoseAuthError(
        error: any,
        authState: any,
        permissions: any
    ): Promise<AuthDiagnosticResult> {
        console.log('Starting comprehensive authentication diagnosis...', { error, authState, permissions });

        const issues: AuthIssue[] = [];
        const recommendations: string[] = [];
        let needsUserAction = false;
        let canAutoRecover = false;

        try {
            // System health check
            const systemStatus = await this.checkSystemHealth(authState);

            // Parse the primary error if provided
            if (error) {
                const primaryIssue = this.parseAuthError(error);
                issues.push(primaryIssue);

                if (primaryIssue.requiresUserAction) needsUserAction = true;
                if (primaryIssue.canAutoRecover) canAutoRecover = true;

                if (!recommendations.includes(primaryIssue.suggestedAction)) {
                    recommendations.push(primaryIssue.suggestedAction);
                }
            }

            // Authentication state analysis
            await this.analyzeAuthState(authState, issues, recommendations);

            // Permission analysis
            await this.analyzePermissions(permissions, issues, recommendations);

            // System health issues
            this.analyzeSystemHealth(systemStatus, issues, recommendations);

            // Network connectivity
            if (!systemStatus.networkReachable) {
                issues.push({
                    type: 'network_error',
                    message: 'Unable to reach Google API servers',
                    severity: 'critical',
                    canAutoRecover: true,
                    requiresUserAction: false,
                    suggestedAction: 'Check internet connection'
                });
                recommendations.push('Verify internet connectivity');
            }

            // Update flags based on all issues
            needsUserAction = needsUserAction || issues.some(issue => issue.requiresUserAction);
            canAutoRecover = issues.some(issue => issue.canAutoRecover);

            // Determine overall severity
            const severity = this.determineSeverity(issues);

            // Generate recovery plan
            const recoveryPlan = this.generateRecoveryPlan(issues, systemStatus);

            const result: AuthDiagnosticResult = {
                isHealthy: issues.filter(i => i.severity === 'critical').length === 0,
                severity,
                issues,
                recommendations: [...new Set(recommendations)], // Remove duplicates
                needsUserAction,
                canAutoRecover,
                systemStatus,
                recoveryPlan
            };

            console.log('Authentication diagnosis completed:', {
                isHealthy: result.isHealthy,
                severity: result.severity,
                issuesCount: result.issues.length,
                canAutoRecover: result.canAutoRecover
            });

            return result;

        } catch (diagnosisError) {
            console.error('Error during authentication diagnosis:', diagnosisError);

            return {
                isHealthy: false,
                severity: 'fatal',
                issues: [{
                    type: 'unknown_error',
                    message: 'Failed to diagnose authentication issues',
                    severity: 'critical',
                    canAutoRecover: false,
                    requiresUserAction: true,
                    suggestedAction: 'Try refreshing the page and signing in again',
                    technicalDetails: diagnosisError instanceof Error ? diagnosisError.message : 'Diagnosis failed'
                }],
                recommendations: ['Refresh the page and try signing in again'],
                needsUserAction: true,
                canAutoRecover: false,
                systemStatus: {
                    tokenValid: false,
                    scopesValid: false,
                    networkReachable: false,
                    authManagerHealthy: false,
                    chromeIdentityAvailable: !!chrome.identity,
                    manifestConfigValid: !!chrome.runtime.getManifest().oauth2,
                    cacheOperational: false
                }
            };
        }
    }

    private static async checkSystemHealth(authState: any): Promise<SystemHealthStatus> {
        const status: SystemHealthStatus = {
            tokenValid: false,
            scopesValid: false,
            networkReachable: false,
            authManagerHealthy: false,
            chromeIdentityAvailable: !!chrome.identity,
            manifestConfigValid: !!chrome.runtime.getManifest().oauth2,
            cacheOperational: true
        };

        try {
            // Check auth manager health
            status.authManagerHealthy = typeof authState === 'object' && authState !== null;

            // Check token validity
            if (authState.user?.accessToken) {
                const validation = await AuthUtils.validateToken(authState.user.accessToken, false);
                status.tokenValid = validation.isValid;
                status.scopesValid = validation.hasRequiredScopes;
            }

            // Test network connectivity
            status.networkReachable = await AuthUtils.testNetworkConnectivity();

        } catch (error) {
            console.warn('System health check failed:', error);
            status.cacheOperational = false;
        }

        return status;
    }

    private static async analyzeAuthState(authState: any, issues: AuthIssue[], recommendations: string[]): Promise<void> {
        if (!authState.isAuthenticated) {
            issues.push({
                type: 'no_auth',
                message: 'User is not authenticated',
                severity: 'critical',
                canAutoRecover: false,
                requiresUserAction: true,
                suggestedAction: 'Sign in with your Google account'
            });
            recommendations.push('User needs to sign in with Google');
            return;
        }

        if (!authState.user?.accessToken) {
            issues.push({
                type: 'invalid_token',
                message: 'No access token available',
                severity: 'critical',
                canAutoRecover: false,
                requiresUserAction: true,
                suggestedAction: 'Sign in again to obtain a new token'
            });
            recommendations.push('Re-authentication required');
            return;
        }

        // Check token validation status
        if (authState.validationStatus) {
            const validation = authState.validationStatus;

            if (!validation.isValid) {
                if (validation.isExpired) {
                    issues.push({
                        type: 'token_expired',
                        message: 'Access token has expired',
                        severity: 'critical',
                        canAutoRecover: true,
                        requiresUserAction: false,
                        suggestedAction: 'Token will be automatically refreshed'
                    });
                    recommendations.push('Automatic token refresh will be attempted');
                } else if (!validation.hasRequiredScopes) {
                    issues.push({
                        type: 'insufficient_scope',
                        message: 'Required permissions are missing',
                        severity: 'critical',
                        canAutoRecover: true,
                        requiresUserAction: true,
                        suggestedAction: 'Grant additional permissions during re-authentication'
                    });
                    recommendations.push('Re-authentication with additional permissions required');
                } else {
                    issues.push({
                        type: 'invalid_token',
                        message: 'Token validation failed',
                        severity: 'critical',
                        canAutoRecover: true,
                        requiresUserAction: true,
                        suggestedAction: 'Re-authenticate to obtain a valid token'
                    });
                    recommendations.push('Re-authentication required');
                }
            }

            // Check token expiry warning
            if (validation.expiresAt) {
                const timeUntilExpiry = validation.expiresAt - Date.now();
                const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);

                if (minutesUntilExpiry <= 5 && minutesUntilExpiry > 0) {
                    issues.push({
                        type: 'token_expired',
                        message: `Token expires in ${minutesUntilExpiry} minute${minutesUntilExpiry !== 1 ? 's' : ''}`,
                        severity: 'warning',
                        canAutoRecover: true,
                        requiresUserAction: false,
                        suggestedAction: 'Token will be automatically refreshed soon'
                    });
                    recommendations.push('Token refresh will be triggered automatically');
                }
            }
        }

        // Check for ongoing operations
        if (authState.tokenRefreshInProgress) {
            issues.push({
                type: 'token_expired',
                message: 'Token refresh is currently in progress',
                severity: 'info',
                canAutoRecover: true,
                requiresUserAction: false,
                suggestedAction: 'Wait for token refresh to complete'
            });
        }

        if (authState.isValidating) {
            issues.push({
                type: 'unknown_error',
                message: 'Authentication validation is in progress',
                severity: 'info',
                canAutoRecover: true,
                requiresUserAction: false,
                suggestedAction: 'Wait for validation to complete'
            });
        }
    }

    private static async analyzePermissions(permissions: any, issues: AuthIssue[], recommendations: string[]): Promise<void> {
        if (!permissions) return;

        const missingRequired: string[] = [];

        if (!permissions.hasDrive) {
            missingRequired.push('Google Drive');
        }

        if (!permissions.hasSheets) {
            missingRequired.push('Google Sheets');
        }

        if (missingRequired.length > 0) {
            issues.push({
                type: 'missing_permissions',
                message: `Missing required permissions: ${missingRequired.join(', ')}`,
                severity: 'critical',
                canAutoRecover: true,
                requiresUserAction: true,
                suggestedAction: 'Grant the required permissions during re-authentication',
                technicalDetails: `Required permissions not available: ${missingRequired.join(', ')}`
            });
            recommendations.push(`Grant ${missingRequired.join(' and ')} permissions`);
        }

        // Check optional permissions
        const missingOptional: string[] = [];

        if (!permissions.hasCalendar) {
            missingOptional.push('Google Calendar');
        }

        if (missingOptional.length > 0) {
            issues.push({
                type: 'missing_permissions',
                message: `Optional permissions not available: ${missingOptional.join(', ')}`,
                severity: 'warning',
                canAutoRecover: false,
                requiresUserAction: false,
                suggestedAction: 'Consider granting optional permissions for enhanced functionality',
                technicalDetails: `Optional features unavailable: ${missingOptional.join(', ')}`
            });
            recommendations.push('Consider granting optional permissions for full functionality');
        }
    }

    private static analyzeSystemHealth(systemStatus: SystemHealthStatus, issues: AuthIssue[], recommendations: string[]): void {
        if (!systemStatus.chromeIdentityAvailable) {
            issues.push({
                type: 'unknown_error',
                message: 'Chrome Identity API is not available',
                severity: 'critical',
                canAutoRecover: false,
                requiresUserAction: true,
                suggestedAction: 'Use a supported Chrome extension environment'
            });
            recommendations.push('Ensure extension is running in a supported Chrome environment');
        }

        if (!systemStatus.manifestConfigValid) {
            issues.push({
                type: 'unknown_error',
                message: 'OAuth2 configuration missing in manifest',
                severity: 'critical',
                canAutoRecover: false,
                requiresUserAction: true,
                suggestedAction: 'Contact extension developer - configuration error'
            });
            recommendations.push('Extension configuration needs to be fixed by developer');
        }

        if (!systemStatus.authManagerHealthy) {
            issues.push({
                type: 'unknown_error',
                message: 'Authentication manager is not functioning properly',
                severity: 'critical',
                canAutoRecover: false,
                requiresUserAction: true,
                suggestedAction: 'Try refreshing the page and restarting the extension'
            });
            recommendations.push('Refresh page and restart extension');
        }

        if (!systemStatus.cacheOperational) {
            issues.push({
                type: 'unknown_error',
                message: 'Local storage cache is not operational',
                severity: 'warning',
                canAutoRecover: false,
                requiresUserAction: false,
                suggestedAction: 'Extension will function but may be slower'
            });
            recommendations.push('Clear browser cache if performance issues persist');
        }
    }

    private static determineSeverity(issues: AuthIssue[]): 'healthy' | 'warning' | 'critical' | 'fatal' {
        const criticalCount = issues.filter(issue => issue.severity === 'critical').length;
        const warningCount = issues.filter(issue => issue.severity === 'warning').length;

        if (criticalCount > 2) return 'fatal';
        if (criticalCount > 0) return 'critical';
        if (warningCount > 0) return 'warning';
        return 'healthy';
    }

    private static generateRecoveryPlan(issues: AuthIssue[], _systemStatus: SystemHealthStatus): RecoveryPlan {
        const steps: RecoveryStep[] = [];
        let estimatedTime = 0;
        let requiresUserInteraction = false;
        let successProbability: 'high' | 'medium' | 'low' = 'high';

        // Sort issues by priority (critical first, then by auto-recovery capability)
        const sortedIssues = [...issues].sort((a, b) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1;
            if (a.severity !== 'critical' && b.severity === 'critical') return 1;
            if (a.canAutoRecover && !b.canAutoRecover) return -1;
            if (!a.canAutoRecover && b.canAutoRecover) return 1;
            return 0;
        });

        for (const issue of sortedIssues) {
            if (issue.canAutoRecover) {
                switch (issue.type) {
                    case 'token_expired':
                        steps.push({
                            action: 'refresh_token',
                            description: 'Automatically refresh the expired access token',
                            automated: true,
                            estimatedDuration: 5000
                        });
                        estimatedTime += 5000;
                        break;

                    case 'invalid_token':
                        steps.push({
                            action: 'reauth_user',
                            description: 'Re-authenticate user to obtain valid credentials',
                            automated: false,
                            estimatedDuration: 30000
                        });
                        estimatedTime += 30000;
                        requiresUserInteraction = true;
                        successProbability = 'medium';
                        break;

                    case 'insufficient_scope':
                    case 'missing_permissions':
                        steps.push({
                            action: 'request_permissions',
                            description: 'Request additional permissions from user',
                            automated: false,
                            estimatedDuration: 45000
                        });
                        estimatedTime += 45000;
                        requiresUserInteraction = true;
                        successProbability = 'medium';
                        break;

                    case 'consent_required':
                        steps.push({
                            action: 'consent_flow',
                            description: 'Guide user through consent process',
                            automated: false,
                            estimatedDuration: 60000
                        });
                        estimatedTime += 60000;
                        requiresUserInteraction = true;
                        break;

                    case 'network_error':
                        steps.push({
                            action: 'retry_connection',
                            description: 'Retry network connection after brief delay',
                            automated: true,
                            estimatedDuration: 10000
                        });
                        estimatedTime += 10000;
                        successProbability = successProbability === 'high' ? 'medium' : 'low';
                        break;
                }
            } else if (issue.severity === 'critical') {
                // Non-recoverable critical issues
                steps.push({
                    action: 'manual_intervention',
                    description: `Manual intervention required: ${issue.suggestedAction}`,
                    automated: false,
                    estimatedDuration: 0
                });
                requiresUserInteraction = true;
                successProbability = 'low';
            }
        }

        // Add validation step at the end
        if (steps.length > 0) {
            steps.push({
                action: 'validate_recovery',
                description: 'Validate that recovery was successful',
                automated: true,
                estimatedDuration: 5000
            });
            estimatedTime += 5000;
        }

        // Format estimated time
        const minutes = Math.ceil(estimatedTime / 60000);
        const formattedTime = minutes <= 1 ? 'Less than 1 minute' : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

        return {
            steps,
            estimatedTime: formattedTime,
            successProbability,
            requiresUserInteraction
        };
    }

    // ========== TOKEN REFRESH UTILITIES ==========

    static async attemptTokenRefresh(config: TokenRefreshConfig = {
        interactive: false,
        timeout: 30000,
        retryCount: 3,
        forceReauth: false,
        includeOptionalScopes: false
    }): Promise<OAuthConsentResult> {
        const result: OAuthConsentResult = {
            success: false,
            grantedScopes: [],
            deniedScopes: []
        };

        try {
            console.log('Attempting token refresh with config:', config);

            const requiredScopes = AuthUtils.getRequiredScopes();
            const optionalScopes = config.includeOptionalScopes ? AuthUtils.getOptionalScopes() : [];
            const allScopes = [...requiredScopes, ...optionalScopes];

            // Try refresh with retry logic
            for (let attempt = 1; attempt <= config.retryCount; attempt++) {
                try {
                    const refreshResult = await this.performTokenRefresh(allScopes, config);

                    if (refreshResult.success) {
                        result.success = true;
                        result.newToken = refreshResult.newToken;
                        result.grantedScopes = refreshResult.grantedScopes;

                        // Identify any denied scopes
                        result.deniedScopes = allScopes.filter(scope =>
                            !refreshResult.grantedScopes.includes(scope)
                        );

                        console.log(`Token refresh successful on attempt ${attempt}`);
                        return result;
                    }
                } catch (attemptError) {
                    console.warn(`Token refresh attempt ${attempt} failed:`, attemptError);

                    if (attempt === config.retryCount) {
                        result.error = attemptError instanceof Error ? attemptError.message : 'Token refresh failed';
                    }

                    // Wait before retry (exponential backoff)
                    if (attempt < config.retryCount) {
                        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            return result;

        } catch (error) {
            console.error('Token refresh failed:', error);
            result.error = error instanceof Error ? error.message : 'Token refresh failed';
            return result;
        }
    }

    private static async performTokenRefresh(scopes: string[], config: TokenRefreshConfig): Promise<{
        success: boolean;
        newToken?: string;
        grantedScopes: string[];
    }> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Token refresh timeout'));
            }, config.timeout);

            chrome.identity.getAuthToken(
                {
                    interactive: config.interactive,
                    scopes: scopes
                },
                async (token) => {
                    clearTimeout(timeoutId);

                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message || 'Token refresh failed'));
                        return;
                    }

                    if (!token) {
                        reject(new Error('No token received'));
                        return;
                    }

                    try {
                        // Validate the new token
                        const validation = await AuthUtils.validateToken(token);

                        if (!validation.isValid) {
                            reject(new Error(`New token validation failed: ${validation.errors.join(', ')}`));
                            return;
                        }

                        // Get granted scopes
                        const grantedScopes = validation.scopeDetails?.grantedScopes || [];

                        resolve({
                            success: true,
                            newToken: token,
                            grantedScopes
                        });

                    } catch (validationError) {
                        reject(validationError);
                    }
                }
            );
        });
    }

    // ========== UTILITY METHODS ==========

    private static errorToString(error: any): string {
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        if (error?.message) return error.message;
        if (error?.toString) return error.toString();
        return JSON.stringify(error) || 'Unknown error';
    }

    private static extractStatusCode(error: any): number {
        if (typeof error === 'number') return error;
        if (error?.status) return error.status;
        if (error?.code) return parseInt(error.code);
        if (error?.response?.status) return error.response.status;

        const errorStr = this.errorToString(error);
        const statusMatch = errorStr.match(/\b([4-5]\d{2})\b/);
        return statusMatch ? parseInt(statusMatch[1]) : 0;
    }

    // ========== DEBUG AND MONITORING ==========

    static async getDetailedDiagnostics(authState?: any, permissions?: any): Promise<{
        systemInfo: SystemHealthStatus;
        authAnalysis: any;
        permissionAnalysis: any;
        networkStatus: boolean;
        cacheStatus: any;
        recommendations: string[];
    }> {
        const diagnostics = {
            systemInfo: {
                tokenValid: false,
                scopesValid: false,
                networkReachable: false,
                authManagerHealthy: false,
                chromeIdentityAvailable: !!chrome?.identity,
                manifestConfigValid: false,
                cacheOperational: true
            } as SystemHealthStatus,
            authAnalysis: null,
            permissionAnalysis: null,
            networkStatus: false,
            cacheStatus: null,
            recommendations: [] as string[]
        };

        try {
            // System health check
            diagnostics.systemInfo = await this.checkSystemHealth(authState);
            diagnostics.networkStatus = diagnostics.systemInfo.networkReachable;

            // Auth state analysis
            if (authState) {
                diagnostics.authAnalysis = {
                    isAuthenticated: authState.isAuthenticated,
                    hasUser: !!authState.user,
                    hasToken: !!authState.user?.accessToken,
                    tokenExpiry: authState.validationStatus?.expiresAt,
                    validationErrors: authState.validationStatus?.errors || [],
                    isValidating: authState.isValidating,
                    tokenRefreshInProgress: authState.tokenRefreshInProgress,
                    lastValidation: authState.lastValidation,
                    canProceed: authState.canProceed
                };

                // Add recommendations based on auth state
                if (!authState.isAuthenticated) {
                    diagnostics.recommendations.push('User authentication required');
                }
                if (authState.validationStatus?.needsReauth) {
                    diagnostics.recommendations.push('Re-authentication needed');
                }
                if (authState.validationStatus?.isExpired) {
                    diagnostics.recommendations.push('Token refresh required');
                }
            }

            // Permission analysis
            if (permissions) {
                diagnostics.permissionAnalysis = {
                    hasDrive: permissions.hasDrive,
                    hasSheets: permissions.hasSheets,
                    hasCalendar: permissions.hasCalendar,
                    allRequired: permissions.allRequired,
                    folderStructureExists: permissions.folderStructureExists
                };

                // Add permission-based recommendations
                const missingRequired = [];
                if (!permissions.hasDrive) missingRequired.push('Google Drive');
                if (!permissions.hasSheets) missingRequired.push('Google Sheets');

                if (missingRequired.length > 0) {
                    diagnostics.recommendations.push(`Grant ${missingRequired.join(' and ')} permissions`);
                }

                if (!permissions.hasCalendar) {
                    diagnostics.recommendations.push('Consider granting Calendar permission for enhanced features');
                }
            }

            // Cache status
            diagnostics.cacheStatus = AuthUtils.getCacheStats();

            // System-level recommendations
            if (!diagnostics.systemInfo.chromeIdentityAvailable) {
                diagnostics.recommendations.push('Chrome Identity API not available - check extension environment');
            }
            if (!diagnostics.systemInfo.manifestConfigValid) {
                diagnostics.recommendations.push('OAuth2 configuration missing - contact developer');
            }
            if (!diagnostics.systemInfo.networkReachable) {
                diagnostics.recommendations.push('Check internet connectivity');
            }

        } catch (error) {
            console.error('Failed to generate detailed diagnostics:', error);
            diagnostics.recommendations.push('Diagnostic analysis failed - try refreshing and sign in again');
        }

        return diagnostics;
    }

    static formatDiagnosticReport(diagnostic: AuthDiagnosticResult): string {
        const lines: string[] = [];

        lines.push('=== AUTHENTICATION DIAGNOSTIC REPORT ===');
        lines.push(`Status: ${diagnostic.isHealthy ? 'HEALTHY' : 'UNHEALTHY'} (${diagnostic.severity.toUpperCase()})`);
        lines.push(`Issues Found: ${diagnostic.issues.length}`);
        lines.push(`User Action Required: ${diagnostic.needsUserAction ? 'YES' : 'NO'}`);
        lines.push(`Auto-Recovery Possible: ${diagnostic.canAutoRecover ? 'YES' : 'NO'}`);
        lines.push('');

        // System status
        lines.push('--- SYSTEM STATUS ---');
        lines.push(`Token Valid: ${diagnostic.systemStatus.tokenValid ? 'YES' : 'NO'}`);
        lines.push(`Scopes Valid: ${diagnostic.systemStatus.scopesValid ? 'YES' : 'NO'}`);
        lines.push(`Network Reachable: ${diagnostic.systemStatus.networkReachable ? 'YES' : 'NO'}`);
        lines.push(`Chrome Identity API: ${diagnostic.systemStatus.chromeIdentityAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
        lines.push(`Manifest Config: ${diagnostic.systemStatus.manifestConfigValid ? 'VALID' : 'INVALID'}`);
        lines.push('');

        // Issues
        if (diagnostic.issues.length > 0) {
            lines.push('--- ISSUES DETECTED ---');
            diagnostic.issues.forEach((issue, index) => {
                lines.push(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
                lines.push(`   Type: ${issue.type}`);
                lines.push(`   Action: ${issue.suggestedAction}`);
                lines.push(`   Auto-Recover: ${issue.canAutoRecover ? 'Yes' : 'No'}`);
                if (issue.technicalDetails) {
                    lines.push(`   Details: ${issue.technicalDetails}`);
                }
                lines.push('');
            });
        }

        // Recommendations
        if (diagnostic.recommendations.length > 0) {
            lines.push('--- RECOMMENDATIONS ---');
            diagnostic.recommendations.forEach((rec, index) => {
                lines.push(`${index + 1}. ${rec}`);
            });
            lines.push('');
        }

        // Recovery plan
        if (diagnostic.recoveryPlan && diagnostic.recoveryPlan.steps.length > 0) {
            lines.push('--- RECOVERY PLAN ---');
            lines.push(`Estimated Time: ${diagnostic.recoveryPlan.estimatedTime}`);
            lines.push(`Success Probability: ${diagnostic.recoveryPlan.successProbability.toUpperCase()}`);
            lines.push(`User Interaction Required: ${diagnostic.recoveryPlan.requiresUserInteraction ? 'YES' : 'NO'}`);
            lines.push('');
            lines.push('Steps:');
            diagnostic.recoveryPlan.steps.forEach((step, index) => {
                lines.push(`${index + 1}. ${step.description}`);
                lines.push(`   Action: ${step.action}`);
                lines.push(`   Automated: ${step.automated ? 'Yes' : 'No'}`);
                lines.push(`   Duration: ${Math.round(step.estimatedDuration / 1000)}s`);
                lines.push('');
            });
        }

        lines.push('=== END REPORT ===');
        return lines.join('\n');
    }

    // ========== CACHE MANAGEMENT ==========

    private static diagnosticCache = new Map<string, {
        result: AuthDiagnosticResult;
        timestamp: number;
    }>();
    private static readonly DIAGNOSTIC_CACHE_TTL = 30000; // 30 seconds

    static async getCachedDiagnostic(cacheKey: string): Promise<AuthDiagnosticResult | null> {
        const cached = this.diagnosticCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.DIAGNOSTIC_CACHE_TTL) {
            return cached.result;
        }
        return null;
    }

    static cacheDiagnostic(cacheKey: string, result: AuthDiagnosticResult): void {
        this.diagnosticCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });

        // Clean up old entries
        this.cleanupDiagnosticCache();
    }

    static cleanupDiagnosticCache(): void {
        const now = Date.now();
        for (const [key, cached] of this.diagnosticCache.entries()) {
            if (now - cached.timestamp > this.DIAGNOSTIC_CACHE_TTL) {
                this.diagnosticCache.delete(key);
            }
        }
    }

    static clearDiagnosticCache(): void {
        this.diagnosticCache.clear();
    }

    // ========== MONITORING UTILITIES ==========

    static async monitorAuthHealth(
        authState: any,
        permissions: any,
        onHealthChange?: (isHealthy: boolean, issues: AuthIssue[]) => void,
        intervalMs: number = 60000
    ): Promise<() => void> {
        let isRunning = true;
        let lastHealthStatus: boolean | null = null;

        const checkHealth = async () => {
            if (!isRunning) return;

            try {
                const diagnostic = await this.diagnoseAuthError(null, authState, permissions);
                const currentHealthStatus = diagnostic.isHealthy;

                if (lastHealthStatus !== currentHealthStatus && onHealthChange) {
                    onHealthChange(currentHealthStatus, diagnostic.issues);
                }

                lastHealthStatus = currentHealthStatus;

                if (isRunning) {
                    setTimeout(checkHealth, intervalMs);
                }
            } catch (error) {
                console.warn('Auth health monitoring failed:', error);
                if (isRunning) {
                    setTimeout(checkHealth, intervalMs);
                }
            }
        };

        // Start monitoring
        checkHealth();

        // Return cleanup function
        return () => {
            isRunning = false;
        };
    }

    // ========== EXPORT UTILITIES ==========

    static exportDiagnosticData(diagnostic: AuthDiagnosticResult): string {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            diagnostic: {
                ...diagnostic,
                // Remove potentially sensitive information
                systemStatus: {
                    ...diagnostic.systemStatus,
                    // Keep only boolean flags, remove any tokens or sensitive data
                }
            }
        };

        return JSON.stringify(exportData, null, 2);
    }

    static async generateSupportReport(
        authState?: any,
        permissions?: any,
        error?: any
    ): Promise<string> {
        const diagnostic = await this.diagnoseAuthError(error, authState, permissions);
        const detailedDiagnostics = await this.getDetailedDiagnostics(authState, permissions);

        const report = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            extensionVersion: chrome.runtime.getManifest().version,
            diagnostic,
            detailedDiagnostics,
            formattedReport: this.formatDiagnosticReport(diagnostic)
        };

        return JSON.stringify(report, null, 2);
    }
}