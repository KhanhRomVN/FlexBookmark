// src/presentation/tab/HabitManager/hooks/auth/useAuth.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import ChromeAuthManager, { AuthState, PermissionCheckResult, TokenValidationResult, SERVICE_SCOPES } from '../../../../../utils/chromeAuth';

export interface CoreAuthState extends AuthState {
    validationStatus: TokenValidationResult | null;
    permissionStatus: PermissionCheckResult | null;
    isReady: boolean;
    isValidating: boolean;
    lastValidation: number | null;
}

export interface AuthOperationResult {
    success: boolean;
    error?: string;
    needsReauth?: boolean;
    missingScopes?: string[];
}

export interface AuthHookConfig {
    requiredScopes?: string[];
    autoValidate?: boolean;
    validationDelay?: number;
}

const DEFAULT_CONFIG: Required<AuthHookConfig> = {
    requiredScopes: [
        ...SERVICE_SCOPES.CORE,
        ...SERVICE_SCOPES.DRIVE,
        ...SERVICE_SCOPES.SHEETS
    ],
    autoValidate: true,
    validationDelay: 3000
};

export const useAuth = (config?: AuthHookConfig) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const authManager = ChromeAuthManager.getInstance();
    const initPromiseRef = useRef<Promise<void> | null>(null);
    const hasInitialized = useRef<boolean>(false);
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [authState, setAuthState] = useState<CoreAuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
        validationStatus: null,
        permissionStatus: null,
        isReady: false,
        isValidating: false,
        lastValidation: null
    });

    const updateAuthState = useCallback((updates: Partial<CoreAuthState>) => {
        setAuthState(prev => {
            const newState = { ...prev, ...updates };
            newState.isReady = Boolean(
                newState.isAuthenticated &&
                newState.user?.accessToken &&
                newState.validationStatus?.isValid &&
                newState.permissionStatus?.hasRequiredScopes &&
                !newState.loading &&
                !newState.isValidating &&
                !newState.error
            );

            console.log('🔄 Auth state updated:', {
                isAuthenticated: newState.isAuthenticated,
                hasToken: !!newState.user?.accessToken,
                validationValid: newState.validationStatus?.isValid,
                permissionsValid: newState.permissionStatus?.hasRequiredScopes,
                isReady: newState.isReady,
                loading: newState.loading,
                isValidating: newState.isValidating
            });

            return newState;
        });
    }, []);

    const validateAuthentication = useCallback(async (force: boolean = false): Promise<boolean> => {
        const currentUser = authManager.getCurrentUser();
        const currentToken = currentUser?.accessToken;

        if (!authManager.isAuthenticated || !currentToken) {
            console.log('❌ No authentication to validate');
            updateAuthState({
                validationStatus: {
                    isValid: false,
                    isExpired: true,
                    expiresAt: null,
                    hasRequiredScopes: false,
                    grantedScopes: [],
                    errors: ['Not authenticated']
                },
                permissionStatus: null,
                isValidating: false,
                lastValidation: Date.now()
            });
            return false;
        }

        console.log('🔍 Starting authentication validation...', { force });
        updateAuthState({ isValidating: true });

        try {
            const tokenValidation = await authManager.validateToken(currentToken);
            console.log('✅ Token validation result:', tokenValidation);

            if (!tokenValidation.isValid) {
                updateAuthState({
                    validationStatus: tokenValidation,
                    permissionStatus: null,
                    isValidating: false,
                    lastValidation: Date.now()
                });
                return false;
            }

            const permissions = await authManager.checkPermissions(currentToken, finalConfig.requiredScopes);
            console.log('✅ Permission check result:', permissions);

            const isValid = tokenValidation.isValid && permissions.hasRequiredScopes;

            updateAuthState({
                validationStatus: tokenValidation,
                permissionStatus: permissions,
                isValidating: false,
                lastValidation: Date.now()
            });

            console.log(`🎯 Validation completed: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
            return isValid;

        } catch (error) {
            console.error('❌ Validation failed:', error);

            updateAuthState({
                validationStatus: {
                    isValid: false,
                    isExpired: true,
                    expiresAt: null,
                    hasRequiredScopes: false,
                    grantedScopes: [],
                    errors: [error instanceof Error ? error.message : 'Validation failed']
                },
                permissionStatus: null,
                isValidating: false,
                lastValidation: Date.now()
            });

            return false;
        }
    }, [authManager, finalConfig.requiredScopes, updateAuthState]);

    const initializeAuth = useCallback(async (): Promise<void> => {
        if (hasInitialized.current || initPromiseRef.current) {
            return initPromiseRef.current || Promise.resolve();
        }

        console.log('🚀 Initializing authentication...');
        hasInitialized.current = true;

        initPromiseRef.current = (async () => {
            try {
                updateAuthState({ loading: true, error: null });
                await authManager.initialize();

                const isAuthenticated = authManager.isAuthenticated;
                const user = authManager.getCurrentUser();

                console.log('📊 Initial auth state:', { isAuthenticated, hasUser: !!user });

                updateAuthState({
                    isAuthenticated,
                    user,
                    loading: false,
                    error: null
                });

                if (finalConfig.autoValidate && isAuthenticated && user?.accessToken) {
                    console.log(`⏰ Scheduling validation in ${finalConfig.validationDelay}ms...`);

                    validationTimeoutRef.current = setTimeout(() => {
                        console.log('🔍 Executing scheduled validation...');
                        validateAuthentication(true);
                    }, finalConfig.validationDelay);
                }

            } catch (error) {
                console.error('❌ Auth initialization failed:', error);
                updateAuthState({
                    loading: false,
                    error: error instanceof Error ? error.message : 'Initialization failed'
                });
            }
        })();

        return initPromiseRef.current;
    }, [authManager, finalConfig.autoValidate, finalConfig.validationDelay, updateAuthState, validateAuthentication]);

    const login = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            console.log('🔐 Starting login...');
            updateAuthState({ loading: true, error: null });

            const success = await authManager.login();

            if (!success) {
                throw new Error('Login failed');
            }

            const user = authManager.getCurrentUser();
            if (!user) {
                throw new Error('No user data after login');
            }

            console.log('✅ Login successful, updating state...');
            updateAuthState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null
            });

            if (finalConfig.autoValidate) {
                setTimeout(() => {
                    validateAuthentication(true);
                }, finalConfig.validationDelay);
            }

            return { success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            console.error('❌ Login error:', error);

            updateAuthState({
                loading: false,
                error: errorMessage,
                isAuthenticated: false,
                user: null,
                validationStatus: null,
                permissionStatus: null
            });

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [authManager, finalConfig.autoValidate, finalConfig.validationDelay, updateAuthState, validateAuthentication]);

    const logout = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            console.log('🚪 Starting logout...');
            updateAuthState({ loading: true });

            await authManager.logout();

            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
                validationStatus: null,
                permissionStatus: null,
                isReady: false,
                isValidating: false,
                lastValidation: null
            });

            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
                validationTimeoutRef.current = null;
            }

            hasInitialized.current = false;
            initPromiseRef.current = null;

            console.log('✅ Logout completed');
            return { success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed';
            console.error('❌ Logout error:', error);

            updateAuthState({ loading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [authManager, updateAuthState]);

    const forceReauth = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            console.log('🔄 Starting force reauth...');
            updateAuthState({ loading: true, error: null });

            const success = await authManager.forceReauth();

            if (!success) {
                throw new Error('Reauth failed');
            }

            const user = authManager.getCurrentUser();
            console.log('✅ Force reauth successful');

            updateAuthState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null,
                validationStatus: null,
                permissionStatus: null
            });

            if (finalConfig.autoValidate) {
                setTimeout(() => {
                    validateAuthentication(true);
                }, finalConfig.validationDelay);
            }

            return { success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Reauth failed';
            console.error('❌ Force reauth error:', error);

            updateAuthState({
                loading: false,
                error: errorMessage
            });

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [authManager, finalConfig.autoValidate, finalConfig.validationDelay, updateAuthState, validateAuthentication]);

    const getAuthStatus = useCallback(() => {
        return {
            isAuthenticated: authState.isAuthenticated,
            user: authState.user,
            loading: authState.loading,
            error: authState.error,
            isReady: authState.isReady,
            isValidating: authState.isValidating,
            lastValidation: authState.lastValidation,
            hasToken: !!authState.user?.accessToken,
            tokenValid: authState.validationStatus?.isValid || false,
            tokenExpired: authState.validationStatus?.isExpired || false,
            tokenExpiry: authState.validationStatus?.expiresAt,
            hasRequiredScopes: authState.permissionStatus?.hasRequiredScopes || false,
            hasDriveAccess: authState.permissionStatus?.hasDriveAccess || false,
            hasSheetsAccess: authState.permissionStatus?.hasSheetsAccess || false,
            hasCalendarAccess: authState.permissionStatus?.hasCalendarAccess || false,
            grantedScopes: authState.validationStatus?.grantedScopes || [],
            validationErrors: authState.validationStatus?.errors || [],
            scopeDetails: authState.permissionStatus?.scopeDetails || []
        };
    }, [authState]);

    const diagnoseAuthIssues = useCallback(() => {
        const issues: Array<{ type: string; severity: 'critical' | 'warning' | 'info'; message: string }> = [];
        const recommendations: string[] = [];

        if (!authState.isAuthenticated) {
            issues.push({ type: 'no_auth', severity: 'critical', message: 'User not authenticated' });
            recommendations.push('Please sign in with your Google account');
        } else if (!authState.validationStatus?.isValid) {
            if (authState.validationStatus?.isExpired) {
                issues.push({ type: 'token_expired', severity: 'critical', message: 'Access token expired' });
                recommendations.push('Please refresh your authentication');
            } else if (!authState.validationStatus?.hasRequiredScopes) {
                issues.push({ type: 'insufficient_scope', severity: 'critical', message: 'Missing required permissions' });
                recommendations.push('Please grant all required permissions');
            } else {
                issues.push({ type: 'token_invalid', severity: 'critical', message: 'Invalid access token' });
                recommendations.push('Please sign in again');
            }
        } else if (!authState.permissionStatus?.hasRequiredScopes) {
            issues.push({ type: 'permission_denied', severity: 'critical', message: 'Required API permissions not available' });
            recommendations.push('Please ensure Drive and Sheets permissions are granted');
        }

        if (authState.validationStatus?.expiresAt) {
            const timeToExpiry = authState.validationStatus.expiresAt - Date.now();
            if (timeToExpiry < 10 * 60 * 1000) {
                issues.push({ type: 'token_expiring', severity: 'warning', message: 'Access token expiring soon' });
                recommendations.push('Token will expire soon, consider refreshing');
            }
        }

        if (authState.isValidating) {
            issues.push({ type: 'validation_in_progress', severity: 'info', message: 'Authentication validation in progress' });
        }

        return {
            isHealthy: issues.filter(i => i.severity === 'critical').length === 0,
            issues,
            recommendations,
            needsUserAction: issues.some(i => i.severity === 'critical'),
            canAutoRecover: authState.isAuthenticated && !authState.validationStatus?.hasRequiredScopes
        };
    }, [authState]);

    const checkScope = useCallback((scope: string): boolean => {
        return authManager.hasScope(scope) || authState.validationStatus?.grantedScopes.includes(scope) || false;
    }, [authManager, authState.validationStatus?.grantedScopes]);

    const getRequiredScopes = useCallback((): string[] => {
        return [...finalConfig.requiredScopes];
    }, [finalConfig.requiredScopes]);

    const attemptAutoRecovery = useCallback(async (): Promise<boolean> => {
        try {
            console.log('🔄 Attempting auto-recovery...');

            const diagnosis = diagnoseAuthIssues();
            if (!diagnosis.canAutoRecover) {
                console.log('❌ Auto-recovery not possible for current issues');
                return false;
            }

            const result = await forceReauth();
            return result.success;
        } catch (error) {
            console.error('❌ Auto-recovery failed:', error);
            return false;
        }
    }, [diagnoseAuthIssues, forceReauth]);

    useEffect(() => {
        if (!hasInitialized.current) {
            initializeAuth();
        }
    }, [initializeAuth]);

    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState) => {
            console.log('🔄 Auth manager state changed:', {
                isAuthenticated: newState.isAuthenticated,
                hasUser: !!newState.user,
                loading: newState.loading,
                error: newState.error
            });

            if (newState.isAuthenticated !== authState.isAuthenticated ||
                newState.user?.accessToken !== authState.user?.accessToken ||
                newState.loading !== authState.loading ||
                newState.error !== authState.error) {

                updateAuthState({
                    isAuthenticated: newState.isAuthenticated,
                    user: newState.user,
                    loading: newState.loading,
                    error: newState.error,
                    validationStatus: null,
                    permissionStatus: null
                });

                if (finalConfig.autoValidate &&
                    newState.isAuthenticated &&
                    newState.user?.accessToken &&
                    (!authState.isAuthenticated || newState.user.accessToken !== authState.user?.accessToken)) {

                    console.log('🎯 New authentication detected, scheduling validation...');

                    if (validationTimeoutRef.current) {
                        clearTimeout(validationTimeoutRef.current);
                    }

                    validationTimeoutRef.current = setTimeout(() => {
                        console.log('🔍 Executing scheduled validation...');
                        validateAuthentication(true);
                    }, finalConfig.validationDelay);
                }
            }
        });

        return unsubscribe;
    }, [authManager, authState.isAuthenticated, authState.user?.accessToken, authState.loading, authState.error, finalConfig.autoValidate, finalConfig.validationDelay, updateAuthState, validateAuthentication]);

    useEffect(() => {
        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
        };
    }, []);

    return {
        authState,
        authManager,
        getAuthStatus,
        diagnoseAuthIssues,
        checkScope,
        getRequiredScopes,
        login,
        logout,
        forceReauth,
        validateAuth: validateAuthentication,
        initializeAuth,
        attemptAutoRecovery,
        isReady: authState.isReady,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.loading || authState.isValidating,
        hasError: !!authState.error,
        user: authState.user,
        permissions: authState.permissionStatus,
        hasDriveAccess: authState.permissionStatus?.hasDriveAccess || false,
        hasSheetsAccess: authState.permissionStatus?.hasSheetsAccess || false,
        hasCalendarAccess: authState.permissionStatus?.hasCalendarAccess || false
    };
};

export default useAuth;