// src/presentation/tab/HabitManager/hooks/auth/useAuth.ts
// Fixed version with proper state synchronization

import { useState, useEffect, useCallback, useRef } from 'react';
import ChromeAuthManager, { AuthState, PermissionCheckResult } from '../../../../../utils/chromeAuth';
import { AuthErrorUtils } from '../../utils/auth/AuthErrorUtils';

// ========== TYPE DEFINITIONS ==========

export interface EnhancedAuthState extends AuthState {
    validationStatus: ValidationStatus;
    permissionStatus: PermissionCheckResult;
    isValidating: boolean;
    canProceed: boolean;
    tokenRefreshInProgress: boolean;
    lastTokenRefresh: number | null;
    lastValidation: number | null;
}

export interface ValidationStatus {
    isValid: boolean;
    hasValidToken: boolean;
    hasRequiredScopes: boolean;
    needsReauth: boolean;
    expiresAt: number | null;
    errors: string[];
    validationInProgress: boolean;
    lastCheck: number | null;
}

export interface AuthOperationResult {
    success: boolean;
    error?: string;
    needsReauth?: boolean;
    needsPermissions?: boolean;
}

// ========== CONSTANTS ==========

const VALIDATION_INTERVALS = {
    PERIODIC: 5 * 60 * 1000, // 5 minutes
    TOKEN_EXPIRY_BUFFER: 10 * 60 * 1000, // 10 minutes
    PERMISSION_CHECK: 15 * 60 * 1000, // 15 minutes
} as const;

// ========== MAIN HOOK ==========

export const useAuth = () => {
    const authManager = ChromeAuthManager.getInstance();
    const initializationRef = useRef<Promise<void> | null>(null);
    const hasInitialized = useRef<boolean>(false);
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const periodicValidationRef = useRef<NodeJS.Timeout | null>(null);
    const permissionCheckRef = useRef<NodeJS.Timeout | null>(null);

    // ========== STATE MANAGEMENT ==========

    const [enhancedAuthState, setEnhancedAuthState] = useState<EnhancedAuthState>({
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
            validationInProgress: false,
            lastCheck: null
        },
        permissionStatus: {
            hasDrive: false,
            hasSheets: false,
            hasCalendar: false,
            allRequired: false
        },
        isValidating: false,
        canProceed: false,
        tokenRefreshInProgress: false,
        lastTokenRefresh: null,
        lastValidation: null
    });

    // ========== UPDATE HELPERS ==========

    const updateState = useCallback((updates: Partial<EnhancedAuthState>) => {
        setEnhancedAuthState(prev => {
            const newState = { ...prev, ...updates };
            console.log('🔄 Auth state update:', {
                updates, newState: {
                    isAuthenticated: newState.isAuthenticated,
                    hasUser: !!newState.user,
                    hasToken: !!newState.user?.accessToken,
                    validationValid: newState.validationStatus.isValid
                }
            });
            return newState;
        });
    }, []);

    const updateValidationStatus = useCallback((updates: Partial<ValidationStatus>) => {
        setEnhancedAuthState(prev => ({
            ...prev,
            validationStatus: { ...prev.validationStatus, ...updates }
        }));
    }, []);

    const updatePermissionStatus = useCallback((updates: Partial<PermissionCheckResult>) => {
        setEnhancedAuthState(prev => ({
            ...prev,
            permissionStatus: { ...prev.permissionStatus, ...updates }
        }));
    }, []);

    // ========== VALIDATION FUNCTIONS ==========

    const validateAuthentication = useCallback(async (forceValidation: boolean = false): Promise<ValidationStatus> => {
        console.log('🔍 validateAuthentication: Starting...', {
            forceValidation,
            validationInProgress: enhancedAuthState.validationStatus.validationInProgress,
            isAuthenticated: enhancedAuthState.isAuthenticated,
            hasUser: !!enhancedAuthState.user,
            hasAccessToken: !!enhancedAuthState.user?.accessToken,
            lastValidation: enhancedAuthState.validationStatus.lastCheck
        });

        if (enhancedAuthState.validationStatus.validationInProgress && !forceValidation) {
            console.log('🔄 validateAuthentication: Already in progress, returning existing status');
            return enhancedAuthState.validationStatus;
        }

        const lastValidation = enhancedAuthState.validationStatus.lastCheck;
        if (!forceValidation && lastValidation && (Date.now() - lastValidation < 60000)) {
            console.log('⏳ validateAuthentication: Recent validation exists, skipping');
            return enhancedAuthState.validationStatus;
        }

        console.log('🏁 validateAuthentication: Starting comprehensive validation...');

        updateValidationStatus({ validationInProgress: true });
        updateState({ isValidating: true });

        try {
            // CRITICAL FIX: Get fresh auth state from manager
            const currentAuthState = {
                isAuthenticated: authManager.isAuthenticated,
                user: authManager.getCurrentUser()
            };

            console.log('🔍 validateAuthentication: Fresh auth state from manager:', currentAuthState);

            // Update state with fresh values if different
            if (currentAuthState.isAuthenticated !== enhancedAuthState.isAuthenticated ||
                currentAuthState.user?.accessToken !== enhancedAuthState.user?.accessToken) {
                console.log('🔄 validateAuthentication: Syncing state with auth manager');
                updateState({
                    isAuthenticated: currentAuthState.isAuthenticated,
                    user: currentAuthState.user
                });
            }

            if (!currentAuthState.isAuthenticated || !currentAuthState.user?.accessToken) {
                console.log('❌ validateAuthentication: No auth or token');
                const status: ValidationStatus = {
                    isValid: false,
                    hasValidToken: false,
                    hasRequiredScopes: false,
                    needsReauth: !currentAuthState.isAuthenticated,
                    expiresAt: null,
                    errors: ['User not authenticated or no access token'],
                    validationInProgress: false,
                    lastCheck: Date.now()
                };

                updateValidationStatus(status);
                updateState({ isValidating: false, canProceed: false });
                console.log('❌ validateAuthentication: Completed with no auth', status);
                return status;
            }

            console.log('🔐 validateAuthentication: Validating token...');
            // Validate token
            const tokenValidation = await authManager.validateToken(currentAuthState.user.accessToken);
            console.log('🔍 validateAuthentication: Token validation result', tokenValidation);

            console.log('🔑 validateAuthentication: Checking permissions...');
            // Check permissions
            const permissions = await authManager.checkAllPermissions();
            console.log('🔍 validateAuthentication: Permission check result', permissions);
            updatePermissionStatus(permissions);

            const status: ValidationStatus = {
                isValid: tokenValidation.isValid && permissions.allRequired,
                hasValidToken: tokenValidation.isValid,
                hasRequiredScopes: tokenValidation.hasRequiredScopes && permissions.allRequired,
                needsReauth: tokenValidation.isExpired || !permissions.allRequired,
                expiresAt: tokenValidation.expiresAt,
                errors: tokenValidation.errors,
                validationInProgress: false,
                lastCheck: Date.now()
            };

            console.log('📊 validateAuthentication: Final status', status);

            updateValidationStatus(status);
            updateState({
                isValidating: false,
                canProceed: status.isValid && permissions.allRequired,
                lastValidation: Date.now()
            });

            if (status.expiresAt) {
                console.log('⏰ validateAuthentication: Scheduling token validation');
                scheduleTokenValidation(status.expiresAt);
            }

            console.log('✅ validateAuthentication: Completed successfully');
            return status;

        } catch (error) {
            console.error('❌ validateAuthentication: Failed with error:', error);

            const status: ValidationStatus = {
                isValid: false,
                hasValidToken: false,
                hasRequiredScopes: false,
                needsReauth: true,
                expiresAt: null,
                errors: [error instanceof Error ? error.message : 'Validation failed'],
                validationInProgress: false,
                lastCheck: Date.now()
            };

            updateValidationStatus(status);
            updateState({ isValidating: false, canProceed: false });
            console.log('❌ validateAuthentication: Completed with error', status);
            return status;
        }
    }, [
        enhancedAuthState.isAuthenticated,
        enhancedAuthState.user?.accessToken,
        enhancedAuthState.validationStatus,
        authManager,
        updateValidationStatus,
        updateState,
        updatePermissionStatus
    ]);

    // ========== TOKEN MANAGEMENT ==========

    const refreshAccessToken = useCallback(async (): Promise<AuthOperationResult> => {
        if (enhancedAuthState.tokenRefreshInProgress) {
            return { success: false, error: 'Token refresh already in progress' };
        }

        console.log('Starting access token refresh...');
        updateState({ tokenRefreshInProgress: true });

        try {
            // Use auth manager to refresh token
            const success = await authManager.refreshToken();

            if (success) {
                // Get fresh auth state after refresh
                const freshAuthState = {
                    isAuthenticated: authManager.isAuthenticated,
                    user: authManager.getCurrentUser()
                };

                updateState({
                    ...freshAuthState,
                    tokenRefreshInProgress: false,
                    lastTokenRefresh: Date.now()
                });

                // Re-validate after refresh
                await validateAuthentication(true);

                return { success: true };
            } else {
                throw new Error('Token refresh failed');
            }

        } catch (error) {
            console.error('Token refresh failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';

            updateState({ tokenRefreshInProgress: false });

            return {
                success: false,
                error: errorMessage,
                needsReauth: AuthErrorUtils.isAuthError(error)
            };
        }
    }, [enhancedAuthState.tokenRefreshInProgress, authManager, updateState, validateAuthentication]);

    const shouldRefreshToken = useCallback((): boolean => {
        const { expiresAt } = enhancedAuthState.validationStatus;
        if (!expiresAt) return false;

        const timeUntilExpiry = expiresAt - Date.now();
        return timeUntilExpiry <= VALIDATION_INTERVALS.TOKEN_EXPIRY_BUFFER;
    }, [enhancedAuthState.validationStatus.expiresAt]);

    // ========== SCHEDULING ==========

    const scheduleTokenValidation = useCallback((expiresAt: number) => {
        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
        }

        const timeUntilExpiry = expiresAt - Date.now();
        const validationDelay = Math.max(60000, timeUntilExpiry - VALIDATION_INTERVALS.TOKEN_EXPIRY_BUFFER);

        validationTimeoutRef.current = setTimeout(() => {
            if (enhancedAuthState.isAuthenticated) {
                console.log('Scheduled token validation triggered');
                validateAuthentication(true);
            }
        }, validationDelay);

        console.log(`Scheduled token validation in ${Math.round(validationDelay / 1000)} seconds`);
    }, [enhancedAuthState.isAuthenticated, validateAuthentication]);

    const startPeriodicValidation = useCallback(() => {
        if (periodicValidationRef.current) {
            clearTimeout(periodicValidationRef.current);
        }

        periodicValidationRef.current = setTimeout(() => {
            if (enhancedAuthState.isAuthenticated) {
                console.log('Periodic validation triggered');
                validateAuthentication(false);
                startPeriodicValidation(); // Reschedule
            }
        }, VALIDATION_INTERVALS.PERIODIC);

        console.log('Started periodic auth validation');
    }, [enhancedAuthState.isAuthenticated, validateAuthentication]);

    const startPeriodicPermissionCheck = useCallback(() => {
        if (permissionCheckRef.current) {
            clearTimeout(permissionCheckRef.current);
        }

        permissionCheckRef.current = setTimeout(async () => {
            if (enhancedAuthState.isAuthenticated) {
                console.log('Periodic permission check triggered');
                const permissions = await authManager.checkAllPermissions();
                updatePermissionStatus(permissions);
                startPeriodicPermissionCheck(); // Reschedule
            }
        }, VALIDATION_INTERVALS.PERMISSION_CHECK);
    }, [enhancedAuthState.isAuthenticated, authManager, updatePermissionStatus]);

    const clearAllTimers = useCallback(() => {
        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
            validationTimeoutRef.current = null;
        }
        if (periodicValidationRef.current) {
            clearTimeout(periodicValidationRef.current);
            periodicValidationRef.current = null;
        }
        if (permissionCheckRef.current) {
            clearTimeout(permissionCheckRef.current);
            permissionCheckRef.current = null;
        }
        console.log('All auth timers cleared');
    }, []);

    // ========== INITIALIZATION ==========

    const initializeAuth = useCallback(async (): Promise<void> => {
        if (initializationRef.current) {
            return initializationRef.current;
        }

        if (hasInitialized.current) {
            return;
        }

        console.log('Initializing enhanced auth system...');

        initializationRef.current = (async () => {
            try {
                updateState({ loading: true, error: null });

                await authManager.initialize();

                // Get fresh auth state immediately after initialization
                const freshAuthState = {
                    isAuthenticated: authManager.isAuthenticated,
                    user: authManager.getCurrentUser()
                };

                console.log('🔄 Auth initialization - fresh state:', freshAuthState);

                updateState({
                    ...freshAuthState,
                    loading: false,
                    error: null
                });

                if (freshAuthState.isAuthenticated && freshAuthState.user?.accessToken) {
                    console.log('User authenticated, starting validation...');
                    await validateAuthentication(true);

                    // Start periodic checks only if authenticated
                    startPeriodicValidation();
                    startPeriodicPermissionCheck();

                    hasInitialized.current = true;
                } else {
                    console.log('User not authenticated');
                    updateValidationStatus({
                        isValid: false,
                        hasValidToken: false,
                        hasRequiredScopes: false,
                        needsReauth: false,
                        expiresAt: null,
                        errors: ['User not authenticated'],
                        validationInProgress: false,
                        lastCheck: Date.now()
                    });
                    updateState({ canProceed: false });
                }

            } catch (error) {
                console.error('Auth initialization failed:', error);
                const errorMessage = error instanceof Error ? error.message : 'Auth initialization failed';

                updateState({
                    loading: false,
                    error: errorMessage,
                    canProceed: false
                });
            } finally {
                initializationRef.current = null;
            }
        })();

        return initializationRef.current;
    }, [authManager, updateState, updateValidationStatus, validateAuthentication, startPeriodicValidation, startPeriodicPermissionCheck]);

    // ========== AUTHENTICATION ACTIONS ==========

    const handleLogin = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            updateState({ loading: true, error: null });

            console.log('Starting login process...');
            const success = await authManager.login();

            if (success) {
                // Get fresh auth state after login
                const freshAuthState = {
                    isAuthenticated: authManager.isAuthenticated,
                    user: authManager.getCurrentUser()
                };

                console.log('Login successful, fresh state:', freshAuthState);

                updateState({
                    ...freshAuthState,
                    loading: false
                });

                await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for state sync

                const validationResult = await validateAuthentication(true);

                if (!validationResult.isValid) {
                    return {
                        success: false,
                        error: `Login validation failed: ${validationResult.errors.join(', ')}`,
                        needsReauth: validationResult.needsReauth
                    };
                }

                startPeriodicValidation();
                startPeriodicPermissionCheck();

                console.log('Login completed successfully');
                return { success: true };
            } else {
                throw new Error('Login failed');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            console.error('Login failed:', errorMessage);
            updateState({ error: errorMessage, loading: false });

            return {
                success: false,
                error: errorMessage,
                needsReauth: AuthErrorUtils.isAuthError(error)
            };
        }
    }, [authManager, validateAuthentication, updateState, startPeriodicValidation, startPeriodicPermissionCheck]);

    const handleLogout = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            updateState({ loading: true, error: null });
            console.log('Starting logout process...');

            clearAllTimers();
            await authManager.logout();

            console.log('Logout completed successfully');
            return { success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed';
            console.error('Logout failed:', errorMessage);
            updateState({ error: errorMessage });
            return { success: false, error: errorMessage };
        } finally {
            updateState({
                loading: false,
                isAuthenticated: false,
                user: null,
                canProceed: false,
                tokenRefreshInProgress: false,
                lastTokenRefresh: null,
                validationStatus: {
                    isValid: false,
                    hasValidToken: false,
                    hasRequiredScopes: false,
                    needsReauth: false,
                    expiresAt: null,
                    errors: [],
                    validationInProgress: false,
                    lastCheck: null
                },
                permissionStatus: {
                    hasDrive: false,
                    hasSheets: false,
                    hasCalendar: false,
                    allRequired: false
                }
            });

            hasInitialized.current = false;
        }
    }, [authManager, clearAllTimers, updateState]);

    const handleForceReauth = useCallback(async (): Promise<AuthOperationResult> => {
        try {
            updateState({ loading: true, error: null });
            console.log('Starting force reauth process...');

            clearAllTimers();

            const success = await authManager.forceReauth();

            if (success) {
                // Get fresh auth state after reauth
                const freshAuthState = {
                    isAuthenticated: authManager.isAuthenticated,
                    user: authManager.getCurrentUser()
                };

                console.log('Force reauth successful, fresh state:', freshAuthState);

                updateState({
                    ...freshAuthState,
                    loading: false
                });

                await new Promise(resolve => setTimeout(resolve, 1500)); // Allow time for state sync

                const validationResult = await validateAuthentication(true);

                if (!validationResult.isValid) {
                    return {
                        success: false,
                        error: `Reauth validation failed: ${validationResult.errors.join(', ')}`,
                        needsPermissions: !enhancedAuthState.permissionStatus.allRequired
                    };
                }

                startPeriodicValidation();
                startPeriodicPermissionCheck();

                console.log('Force reauth completed successfully');
                return { success: true };
            } else {
                throw new Error('Force reauth failed');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Re-authentication failed';
            console.error('Force reauth failed:', errorMessage);
            updateState({ error: errorMessage, loading: false });

            return {
                success: false,
                error: errorMessage,
                needsPermissions: errorMessage.includes('permission')
            };
        }
    }, [authManager, validateAuthentication, updateState, clearAllTimers, startPeriodicValidation, startPeriodicPermissionCheck, enhancedAuthState.permissionStatus.allRequired]);

    const triggerValidation = useCallback(async (): Promise<boolean> => {
        const result = await validateAuthentication(true);
        return result.isValid;
    }, [validateAuthentication]);

    // ========== STATUS FUNCTIONS ==========

    const isAuthReady = useCallback((): boolean => {
        return enhancedAuthState.isAuthenticated &&
            enhancedAuthState.canProceed &&
            !enhancedAuthState.loading &&
            !enhancedAuthState.isValidating &&
            !enhancedAuthState.tokenRefreshInProgress &&
            enhancedAuthState.permissionStatus.allRequired &&
            enhancedAuthState.validationStatus.isValid;
    }, [enhancedAuthState]);

    const getAuthStatus = useCallback(() => {
        return {
            // Core state
            isAuthenticated: enhancedAuthState.isAuthenticated,
            hasUser: !!enhancedAuthState.user,
            hasToken: !!enhancedAuthState.user?.accessToken,
            loading: enhancedAuthState.loading,
            error: enhancedAuthState.error,
            user: enhancedAuthState.user,

            // Validation status
            isValid: enhancedAuthState.validationStatus.isValid,
            hasValidToken: enhancedAuthState.validationStatus.hasValidToken,
            hasRequiredScopes: enhancedAuthState.validationStatus.hasRequiredScopes,
            needsReauth: enhancedAuthState.validationStatus.needsReauth,
            lastValidation: enhancedAuthState.validationStatus.lastCheck,
            expiresAt: enhancedAuthState.validationStatus.expiresAt,
            validationErrors: enhancedAuthState.validationStatus.errors,
            isValidating: enhancedAuthState.isValidating,

            // Permission status
            permissions: enhancedAuthState.permissionStatus,

            // Operation status
            canProceed: enhancedAuthState.canProceed,
            isReady: isAuthReady(),
            tokenRefreshInProgress: enhancedAuthState.tokenRefreshInProgress,
            lastTokenRefresh: enhancedAuthState.lastTokenRefresh,
            shouldRefreshToken: shouldRefreshToken()
        };
    }, [enhancedAuthState, isAuthReady, shouldRefreshToken]);

    const diagnoseAuthIssues = useCallback(async (error?: any) => {
        return AuthErrorUtils.diagnoseAuthError(
            error,
            enhancedAuthState,
            enhancedAuthState.permissionStatus
        );
    }, [enhancedAuthState]);

    // ========== AUTO RECOVERY ==========

    const attemptAutoRecovery = useCallback(async (diagnostic: any): Promise<boolean> => {
        if (!diagnostic.issues.some((issue: any) => issue.canAutoRecover)) {
            return false;
        }

        try {
            console.log('Attempting auto-recovery...');

            // Try token refresh first
            if (shouldRefreshToken()) {
                const refreshResult = await refreshAccessToken();
                if (refreshResult.success) {
                    return true;
                }
            }

            // If token refresh fails, try force reauth
            const reauthResult = await handleForceReauth();
            return reauthResult.success;

        } catch (error) {
            console.error('Auto-recovery failed:', error);
            return false;
        }
    }, [shouldRefreshToken, refreshAccessToken, handleForceReauth]);

    // ========== EFFECTS ==========

    useEffect(() => {
        const unsubscribe = authManager.subscribe(async (newAuthState) => {
            console.log('🔔 Auth manager state change:', newAuthState);

            // Sync with auth manager state
            updateState(prev => ({
                ...prev,
                ...newAuthState
            }));

            if (!newAuthState.isAuthenticated) {
                clearAllTimers();
                updateState(prev => ({
                    ...prev,
                    validationStatus: {
                        ...prev.validationStatus,
                        isValid: false,
                        hasValidToken: false,
                        hasRequiredScopes: false,
                        needsReauth: false,
                        errors: [],
                        validationInProgress: false,
                        lastCheck: Date.now()
                    },
                    permissionStatus: {
                        hasDrive: false,
                        hasSheets: false,
                        hasCalendar: false,
                        allRequired: false
                    },
                    canProceed: false
                }));
            }
        });

        // Initialize auth only once
        if (!hasInitialized.current) {
            initializeAuth();
        }

        return () => {
            unsubscribe();
            clearAllTimers();
            if (initializationRef.current) {
                initializationRef.current = null;
            }
        };
    }, [authManager, updateState, clearAllTimers, initializeAuth]);

    useEffect(() => {
        if (enhancedAuthState.validationStatus.expiresAt && enhancedAuthState.isAuthenticated) {
            scheduleTokenValidation(enhancedAuthState.validationStatus.expiresAt);
        }
    }, [enhancedAuthState.validationStatus.expiresAt, enhancedAuthState.isAuthenticated, scheduleTokenValidation]);

    useEffect(() => {
        return () => {
            clearAllTimers();
            if (initializationRef.current) {
                initializationRef.current = null;
            }
            hasInitialized.current = false;
        };
    }, [clearAllTimers]);

    // ========== RETURN INTERFACE ==========

    return {
        // State
        authState: enhancedAuthState,
        authManager,

        // Status functions
        isAuthReady,
        getAuthStatus,
        diagnoseAuthIssues,

        // Actions
        handleLogin,
        handleLogout,
        handleForceReauth,
        handleValidateAuth: triggerValidation,
        initializeAuth,
        refreshAccessToken,
        attemptAutoRecovery,

        // Utilities
        shouldRefreshToken,
        validateAuthentication,
        triggerValidation,
        clearAllTimers,

        // Computed values
        permissions: enhancedAuthState.permissionStatus,
        isCheckingPermissions: enhancedAuthState.isValidating,

        // Constants
        VALIDATION_INTERVALS
    };
};

export default useAuth;