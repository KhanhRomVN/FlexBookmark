// src/presentation/tab/HabitManager/hooks/auth/useAuth.ts
// Fixed version with proper validation logic

import { useState, useEffect, useCallback, useRef } from 'react';
import ChromeAuthManager, { AuthState, PermissionCheckResult } from '../../../../../utils/chromeAuth';

// ========== TYPE DEFINITIONS ==========

export interface EnhancedAuthState extends AuthState {
    validationStatus: ValidationStatus;
    permissionStatus: PermissionCheckResult;
    canProceed: boolean;
    lastValidation: number | null;
    isValidating: boolean;
    tokenRefreshInProgress: boolean;
}

export interface ValidationStatus {
    isValid: boolean;
    hasValidToken: boolean;
    hasRequiredScopes: boolean;
    needsReauth: boolean;
    expiresAt: number | null;
    errors: string[];
    lastCheck: number | null;
    validationInProgress: boolean;
}

export interface AuthOperationResult {
    success: boolean;
    error?: string;
    needsReauth?: boolean;
    needsPermissions?: boolean;
}

// ========== MAIN HOOK ==========

export const useAuth = () => {
    const authManager = ChromeAuthManager.getInstance();
    const initPromiseRef = useRef<Promise<void> | null>(null);
    const hasInitialized = useRef<boolean>(false);
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ========== ENHANCED STATE ==========
    const [authState, setAuthState] = useState<EnhancedAuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
        validationStatus: {
            isValid: false,
            hasValidToken: false,
            hasRequiredScopes: false,
            needsReauth: false,
            expiresAt: null,
            errors: [],
            lastCheck: null,
            validationInProgress: false
        },
        permissionStatus: {
            hasDrive: false,
            hasSheets: false,
            hasCalendar: false,
            allRequired: false
        },
        canProceed: false,
        lastValidation: null,
        isValidating: false,
        tokenRefreshInProgress: false
    });

    // ========== UPDATE FUNCTIONS ==========
    const updateAuthState = useCallback((updates: Partial<EnhancedAuthState>) => {
        setAuthState(prev => {
            const newState = { ...prev, ...updates };
            console.log('Auth state updated:', {
                isAuthenticated: newState.isAuthenticated,
                hasUser: !!newState.user,
                hasToken: !!newState.user?.accessToken,
                tokenLength: newState.user?.accessToken?.length,
                canProceed: newState.canProceed,
                isValidating: newState.isValidating
            });
            return newState;
        });
    }, []);

    const updateValidationStatus = useCallback((updates: Partial<ValidationStatus>) => {
        setAuthState(prev => ({
            ...prev,
            validationStatus: { ...prev.validationStatus, ...updates }
        }));
    }, []);

    // ========== FIXED VALIDATION FUNCTION ==========
    const validateAuthentication = useCallback(async (forceValidation: boolean = false): Promise<boolean> => {
        console.log('🔍 Starting validation check...', {
            forceValidation
        });

        // Lấy dữ liệu mới nhất từ authManager
        const currentUser = authManager.getCurrentUser();
        const currentToken = currentUser?.accessToken;
        const isAuthenticated = authManager.isAuthenticated;
        const now = Date.now();

        // Kiểm tra điều kiện cơ bản
        if (!isAuthenticated || !currentUser || !currentToken || currentToken.length < 10) {
            console.log('❌ Authentication requirements not met');
            updateValidationStatus({
                isValid: false,
                hasValidToken: false,
                hasRequiredScopes: false,
                needsReauth: !isAuthenticated,
                errors: ['User not authenticated or no valid access token'],
                lastCheck: now,
                validationInProgress: false
            });
            updateAuthState({ canProceed: false, isValidating: false });
            return false;
        }

        // Bắt đầu validation nâng cao
        updateValidationStatus({ validationInProgress: true });
        updateAuthState({ isValidating: true });

        try {
            // Step 1: Validate token
            console.log('🔍 Step 1: Validating token...');
            const tokenValidation = await authManager.validateToken(currentToken);
            console.log('🔍 Token validation result:', tokenValidation);

            if (!tokenValidation.isValid) {
                console.log('❌ Token validation failed');
                updateValidationStatus({
                    isValid: false,
                    hasValidToken: false,
                    hasRequiredScopes: false,
                    needsReauth: true,
                    expiresAt: null,
                    errors: tokenValidation.errors,
                    lastCheck: now,
                    validationInProgress: false
                });
                updateAuthState({
                    canProceed: false,
                    isValidating: false,
                    permissionStatus: {
                        hasDrive: false,
                        hasSheets: false,
                        hasCalendar: false,
                        allRequired: false
                    }
                });
                return false;
            }

            // Step 2: Check permissions
            console.log('🔍 Step 2: Checking permissions...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // optional delay
            const permissions = await authManager.checkAllPermissions(currentToken);
            console.log('🔍 Permission check result:', permissions);

            const isValid = tokenValidation.isValid && permissions.allRequired;

            const status = {
                isValid,
                hasValidToken: tokenValidation.isValid,
                hasRequiredScopes: permissions.allRequired,
                needsReauth: !isValid,
                expiresAt: tokenValidation.expiresAt,
                errors: isValid ? [] : [
                    ...tokenValidation.errors,
                    ...(permissions.allRequired ? [] : ['Missing required permissions'])
                ],
                lastCheck: now,
                validationInProgress: false
            };

            updateValidationStatus(status);
            updateAuthState({
                isValidating: false,
                canProceed: isValid,
                permissionStatus: permissions,
                lastValidation: now
            });

            console.log(`🎯 Validation completed: ${isValid ? 'SUCCESS' : 'FAILED'}`, {
                hasValidToken: status.hasValidToken,
                hasRequiredScopes: status.hasRequiredScopes,
                canProceed: isValid,
                permissions
            });

            return isValid;

        } catch (error) {
            console.error('💥 Validation failed with error:', error);

            const status = {
                isValid: false,
                hasValidToken: false,
                hasRequiredScopes: false,
                needsReauth: true,
                expiresAt: null,
                errors: [error instanceof Error ? error.message : 'Validation failed'],
                lastCheck: now,
                validationInProgress: false
            };

            updateValidationStatus(status);
            updateAuthState({
                isValidating: false,
                canProceed: false,
                permissionStatus: {
                    hasDrive: false,
                    hasSheets: false,
                    hasCalendar: false,
                    allRequired: false
                }
            });

            return false;
        }
    }, [authManager, updateValidationStatus, updateAuthState]);


    // ========== INITIALIZATION ==========
    const initializeAuth = useCallback(async (): Promise<void> => {
        if (hasInitialized.current || initPromiseRef.current) {
            return initPromiseRef.current || Promise.resolve();
        }

        console.log('🚀 Initializing auth system...');
        hasInitialized.current = true;

        initPromiseRef.current = (async () => {
            try {
                updateAuthState({ loading: true, error: null });

                // Initialize auth manager
                await authManager.initialize();

                // Get initial state
                const isAuthenticated = authManager.isAuthenticated;
                const user = authManager.getCurrentUser();

                console.log('📊 Initial auth state:', {
                    isAuthenticated,
                    hasUser: !!user,
                    hasToken: !!user?.accessToken,
                    tokenLength: user?.accessToken?.length
                });

                updateAuthState({
                    isAuthenticated,
                    user,
                    loading: false
                });

                // Validate if authenticated - with longer delay
                if (isAuthenticated && user?.accessToken) {
                    console.log('⏰ Scheduling validation in 3 seconds...');
                    setTimeout(() => {
                        console.log('🔄 Executing scheduled validation...');
                        validateAuthentication(true);
                    }, 3000); // Increased delay
                }

            } catch (error) {
                console.error('💥 Auth initialization failed:', error);
                updateAuthState({
                    loading: false,
                    error: error instanceof Error ? error.message : 'Initialization failed'
                });
            }
        })();

        return initPromiseRef.current;
    }, [authManager, updateAuthState, validateAuthentication]);

    // ========== AUTH ACTIONS ==========
    const handleLogin = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            updateAuthState({ loading: true, error: null });

            const success = await authManager.login();

            if (success) {
                const user = authManager.getCurrentUser();

                // Wait a bit for permissions to propagate
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Validate permissions
                const permissions = await authManager.checkAllPermissions();

                if (!permissions.allRequired) {
                    console.warn('Missing required permissions after login:', permissions);
                    return {
                        success: false,
                        error: 'Required permissions not granted. Please ensure you grant Drive and Sheets access.',
                        needsPermissions: true
                    };
                }

                updateAuthState({
                    isAuthenticated: true,
                    user,
                    loading: false,
                    error: null
                });

                return { success: true };
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            console.error('💥 Login error:', error);
            updateAuthState({
                loading: false,
                error: errorMessage,
                isAuthenticated: false,
                user: null
            });

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [authManager, updateAuthState]);

    const handleLogout = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            updateAuthState({ loading: true });

            await authManager.logout();

            // Reset state completely
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null,
                validationStatus: {
                    isValid: false,
                    hasValidToken: false,
                    hasRequiredScopes: false,
                    needsReauth: false,
                    expiresAt: null,
                    errors: [],
                    lastCheck: null,
                    validationInProgress: false
                },
                permissionStatus: {
                    hasDrive: false,
                    hasSheets: false,
                    hasCalendar: false,
                    allRequired: false
                },
                canProceed: false,
                lastValidation: null,
                isValidating: false,
                tokenRefreshInProgress: false
            });

            // Clear timeouts
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
                validationTimeoutRef.current = null;
            }

            hasInitialized.current = false;
            initPromiseRef.current = null;

            return { success: true };

        } catch (error) {
            updateAuthState({ loading: false });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Logout failed'
            };
        }
    }, [authManager]);

    const handleForceReauth = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            updateAuthState({ loading: true, error: null });

            const success = await authManager.forceReauth();

            if (success) {
                const user = authManager.getCurrentUser();
                console.log('✅ Force reauth successful, updating state...');

                updateAuthState({
                    isAuthenticated: true,
                    user,
                    loading: false,
                    error: null
                });

                // Validate with delay
                setTimeout(async () => {
                    console.log('🔄 Starting post-reauth validation...');
                    const isValid = await validateAuthentication(true);

                    return {
                        success: isValid,
                        needsPermissions: !authState.permissionStatus.allRequired
                    };
                }, 3000); // Increased delay

                return { success: true };
            } else {
                throw new Error('Reauth failed');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Reauth failed';
            console.error('💥 Reauth error:', error);
            updateAuthState({
                loading: false,
                error: errorMessage
            });

            return {
                success: false,
                error: errorMessage
            };
        }
    }, [authManager, updateAuthState, validateAuthentication, authState.permissionStatus.allRequired]);

    // ========== STATUS FUNCTIONS ==========
    const isAuthReady = useCallback((): boolean => {
        const ready = authState.isAuthenticated &&
            authState.canProceed &&
            !authState.loading &&
            !authState.isValidating &&
            authState.validationStatus.isValid &&
            authState.permissionStatus.allRequired;

        console.log('🎯 Auth ready check:', {
            isAuthenticated: authState.isAuthenticated,
            canProceed: authState.canProceed,
            loading: authState.loading,
            isValidating: authState.isValidating,
            validationValid: authState.validationStatus.isValid,
            allPermissions: authState.permissionStatus.allRequired,
            hasToken: !!authState.user?.accessToken,
            ready
        });

        return ready;
    }, [authState]);

    const getAuthStatus = useCallback(() => {
        return {
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            hasToken: !!authState.user?.accessToken,
            loading: authState.loading,
            error: authState.error,
            user: authState.user,
            isValid: authState.validationStatus.isValid,
            hasValidToken: authState.validationStatus.hasValidToken,
            hasRequiredScopes: authState.validationStatus.hasRequiredScopes,
            needsReauth: authState.validationStatus.needsReauth,
            permissions: authState.permissionStatus,
            canProceed: authState.canProceed,
            isReady: isAuthReady(),
            isValidating: authState.isValidating,
            validationErrors: authState.validationStatus.errors
        };
    }, [authState, isAuthReady]);

    const diagnoseAuthIssues = useCallback(async (error?: any) => {
        const issues = [];
        const recommendations = [];

        console.log('🔍 Diagnosing auth issues with state:', {
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            hasToken: !!authState.user?.accessToken,
            tokenValid: authState.validationStatus.hasValidToken,
            hasScopes: authState.validationStatus.hasRequiredScopes,
            canProceed: authState.canProceed
        });

        if (!authState.isAuthenticated) {
            issues.push({ type: 'no_auth', severity: 'critical', message: 'User not authenticated' });
            recommendations.push('Please sign in with Google');
        } else if (!authState.validationStatus.hasValidToken) {
            issues.push({ type: 'invalid_token', severity: 'critical', message: 'Invalid access token' });
            recommendations.push('Please refresh authentication');
        } else if (!authState.validationStatus.hasRequiredScopes) {
            issues.push({ type: 'insufficient_scope', severity: 'critical', message: 'Missing required permissions' });
            recommendations.push('Please grant Drive and Sheets permissions');
        }

        if (authState.isValidating) {
            issues.push({ type: 'validation_in_progress', severity: 'info', message: 'Validation in progress' });
        }

        return {
            isHealthy: issues.filter(i => i.severity === 'critical').length === 0,
            issues,
            recommendations,
            needsUserAction: issues.some(i => i.severity === 'critical')
        };
    }, [authState]);

    const attemptAutoRecovery = useCallback(async (): Promise<boolean> => {
        try {
            console.log('🔧 Attempting auto-recovery...');
            const result = await handleForceReauth();
            return result.success;
        } catch (error) {
            console.error('💥 Auto-recovery failed:', error);
            return false;
        }
    }, [handleForceReauth]);

    // ========== EFFECTS ==========

    // Single initialization effect
    useEffect(() => {
        if (!hasInitialized.current) {
            initializeAuth();
        }
    }, [initializeAuth]);

    // FIXED: Better auth manager subscription
    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState) => {
            console.log('📡 Auth manager state changed:', {
                isAuthenticated: newState.isAuthenticated,
                hasUser: !!newState.user,
                hasToken: !!newState.user?.accessToken,
                tokenLength: newState.user?.accessToken?.length,
                loading: newState.loading,
                error: newState.error
            });

            // Only update if there are meaningful changes
            if (newState.isAuthenticated !== authState.isAuthenticated ||
                newState.user?.accessToken !== authState.user?.accessToken ||
                newState.loading !== authState.loading ||
                newState.error !== authState.error) {

                updateAuthState({
                    isAuthenticated: newState.isAuthenticated,
                    user: newState.user,
                    loading: newState.loading,
                    error: newState.error
                });

                // Trigger validation for newly authenticated users
                if (newState.isAuthenticated &&
                    newState.user?.accessToken &&
                    (!authState.isAuthenticated || newState.user.accessToken !== authState.user?.accessToken)) {

                    console.log('🔄 New authentication detected, scheduling validation...');

                    if (validationTimeoutRef.current) {
                        clearTimeout(validationTimeoutRef.current);
                    }

                    validationTimeoutRef.current = setTimeout(() => {
                        console.log('⚡ Executing scheduled validation...');
                        validateAuthentication(true);
                    }, 4000); // Increased delay for better reliability
                }
            }
        });

        return unsubscribe;
    }, [authManager, authState.isAuthenticated, authState.user?.accessToken, authState.loading, authState.error, updateAuthState, validateAuthentication]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
            hasInitialized.current = false;
            initPromiseRef.current = null;
        };
    }, []);

    // ========== RETURN INTERFACE ==========
    return {
        // State
        authState,
        authManager,

        // Status functions
        isAuthReady,
        getAuthStatus,
        diagnoseAuthIssues,

        // Actions
        handleLogin,
        handleLogout,
        handleForceReauth,
        handleValidateAuth: validateAuthentication,
        initializeAuth,
        attemptAutoRecovery,

        // Computed values
        permissions: authState.permissionStatus
    };
};

export default useAuth;