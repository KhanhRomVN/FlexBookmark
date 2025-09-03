// src/presentation/tab/HabitManager/hooks/auth/useAuthValidation.ts

import { useCallback, useRef } from 'react';
import { AuthUtils } from '../../utils/auth/AuthUtils';
import type { CoreAuthState } from './useAuth';

// 📚 INTERFACES & TYPES
// ════════════════════════════════════════════════════════════════════════════════

interface ValidationStatus {
    isValid: boolean;
    hasValidToken: boolean;
    hasRequiredScopes: boolean;
    needsReauth: boolean;
    lastValidation: number | null;
    expiresAt: number | null;
    errors: string[];
    validationInProgress: boolean;
}

interface PermissionStatus {
    hasDrive: boolean;
    hasSheets: boolean;
    hasCalendar: boolean;
    allRequired: boolean;
    checked: boolean;
    lastChecked: number | null;
    checkInProgress: boolean;
}

interface UseAuthValidationProps {
    authState: CoreAuthState;
    permissions: PermissionStatus;
    setPermissions: (permissions: PermissionStatus) => void;
    setIsCheckingPermissions: (checking: boolean) => void;
    updateAuthState: (updates: Partial<CoreAuthState>) => void;
    updateValidationStatus: (updates: Partial<ValidationStatus>) => void;
}

const VALIDATION_INTERVALS = {
    PERIODIC: 5 * 60 * 1000,
    TOKEN_EXPIRY_BUFFER: 10 * 60 * 1000,
} as const;

export const useAuthValidation = ({
    authState,
    permissions,
    setPermissions,
    setIsCheckingPermissions,
    updateAuthState,
    updateValidationStatus
}: UseAuthValidationProps) => {
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const periodicValidationRef = useRef<NodeJS.Timeout | null>(null);

    const validateAuthentication = useCallback(async (forceValidation: boolean = false): Promise<ValidationStatus> => {
        // Kiểm tra nếu validation đang tiến hành
        if (authState.isValidating && !forceValidation) {
            return {
                isValid: authState.validationStatus?.isValid || false,
                hasValidToken: false,
                hasRequiredScopes: false,
                needsReauth: false,
                lastValidation: authState.lastValidation,
                expiresAt: authState.validationStatus?.expiresAt || null,
                errors: authState.validationStatus?.errors || [],
                validationInProgress: true
            };
        }

        const lastValidation = authState.lastValidation;
        if (!forceValidation && lastValidation && (Date.now() - lastValidation < 60000)) {
            return {
                isValid: authState.validationStatus?.isValid || false,
                hasValidToken: false,
                hasRequiredScopes: false,
                needsReauth: false,
                lastValidation: authState.lastValidation,
                expiresAt: authState.validationStatus?.expiresAt || null,
                errors: authState.validationStatus?.errors || [],
                validationInProgress: false
            };
        }

        console.log('🔄 Starting comprehensive auth validation...');

        updateValidationStatus({ validationInProgress: true });
        updateAuthState({ isValidating: true });

        try {
            if (!authState.isAuthenticated || !authState.user?.accessToken) {
                const status: ValidationStatus = {
                    isValid: false,
                    hasValidToken: false,
                    hasRequiredScopes: false,
                    needsReauth: !authState.isAuthenticated,
                    lastValidation: Date.now(),
                    expiresAt: null,
                    errors: ['User not authenticated or no access token'],
                    validationInProgress: false
                };

                updateValidationStatus(status);
                updateAuthState({ isValidating: false });
                return status;
            }

            const tokenValidation = await AuthUtils.validateToken(authState.user.accessToken);

            const scopeTestPromises = AuthUtils.getRequiredScopes().map(async (scope) => {
                const scopeName = AuthUtils.getScopeNameFromUrl(scope);
                const hasAccess = await AuthUtils.testScopeAccess(authState.user!.accessToken, scopeName);
                return { [scopeName]: hasAccess };
            });

            const scopeResults = await Promise.all(scopeTestPromises);
            const combinedScopeResults = scopeResults.reduce((acc, result) => ({ ...acc, ...result }), {});
            const hasRequiredScopes = combinedScopeResults.drive && combinedScopeResults.sheets;

            setPermissions({
                ...permissions,
                hasDrive: combinedScopeResults.drive || false,
                hasSheets: combinedScopeResults.sheets || false,
                hasCalendar: combinedScopeResults.calendar || false,
                allRequired: hasRequiredScopes,
                checked: true,
                lastChecked: Date.now(),
                checkInProgress: false
            });

            const status: ValidationStatus = {
                isValid: tokenValidation.isValid && hasRequiredScopes,
                hasValidToken: tokenValidation.isValid,
                hasRequiredScopes,
                needsReauth: tokenValidation.isExpired || !hasRequiredScopes,
                lastValidation: Date.now(),
                expiresAt: tokenValidation.expiresAt,
                errors: tokenValidation.errors,
                validationInProgress: false
            };

            updateValidationStatus(status);
            updateAuthState({
                isValidating: false,
                lastValidation: Date.now()
            });

            scheduleTokenValidation();
            console.log('✅ Auth validation completed:', status);

            return status;

        } catch (error) {
            console.error('❌ Auth validation failed:', error);

            const status: ValidationStatus = {
                isValid: false,
                hasValidToken: false,
                hasRequiredScopes: false,
                needsReauth: true,
                lastValidation: Date.now(),
                expiresAt: null,
                errors: [error instanceof Error ? error.message : 'Validation failed'],
                validationInProgress: false
            };

            updateValidationStatus(status);
            updateAuthState({ isValidating: false });
            return status;
        }
    }, [
        authState.isAuthenticated,
        authState.user?.accessToken,
        authState.validationStatus,
        authState.isValidating,
        authState.lastValidation,
        updateValidationStatus,
        updateAuthState,
        setPermissions,
        permissions
    ]);

    const triggerValidation = useCallback(async (): Promise<boolean> => {
        const result = await validateAuthentication(true);
        return result.isValid;
    }, [validateAuthentication]);

    const refreshPermissions = useCallback(async (): Promise<PermissionStatus> => {
        if (!authState.user?.accessToken) {
            return permissions;
        }

        setIsCheckingPermissions(true);
        setPermissions({ ...permissions, checkInProgress: true });

        try {
            console.log('🔄 Refreshing permission status...');

            const scopeTests = await AuthUtils.testAllScopes(authState.user.accessToken);

            const newPermissions: PermissionStatus = {
                hasDrive: scopeTests.drive || false,
                hasSheets: scopeTests.sheets || false,
                hasCalendar: scopeTests.calendar || false,
                allRequired: scopeTests.drive && scopeTests.sheets,
                checked: true,
                lastChecked: Date.now(),
                checkInProgress: false
            };

            setPermissions(newPermissions);
            console.log('✅ Permission status refreshed:', newPermissions);

            return newPermissions;

        } catch (error) {
            console.error('❌ Failed to refresh permissions:', error);
            setPermissions({ ...permissions, checkInProgress: false });
            return permissions;
        } finally {
            setIsCheckingPermissions(false);
        }
    }, [authState.user?.accessToken, permissions, setPermissions, setIsCheckingPermissions]);

    const checkPermissionScope = useCallback(async (scopeName: string): Promise<boolean> => {
        if (!authState.user?.accessToken) return false;

        try {
            return await AuthUtils.testScopeAccess(authState.user.accessToken, scopeName);
        } catch (error) {
            console.warn(`⚠️ Failed to check ${scopeName} scope:`, error);
            return false;
        }
    }, [authState.user?.accessToken]);

    const scheduleTokenValidation = useCallback(() => {
        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
        }

        const expiresAt = authState.validationStatus?.expiresAt;
        if (expiresAt) {
            const timeUntilExpiry = expiresAt - Date.now();
            const validationDelay = Math.max(60000, timeUntilExpiry - VALIDATION_INTERVALS.TOKEN_EXPIRY_BUFFER);

            validationTimeoutRef.current = setTimeout(() => {
                if (authState.isAuthenticated && authState.user?.accessToken) {
                    console.log('⏰ Scheduled token validation triggered');
                    validateAuthentication(true);
                }
            }, validationDelay);

            console.log(`⏰ Scheduled token validation in ${Math.round(validationDelay / 1000)} seconds`);
        }
    }, [authState.validationStatus?.expiresAt, authState.isAuthenticated, authState.user?.accessToken, validateAuthentication]);

    const startPeriodicValidation = useCallback(() => {
        if (periodicValidationRef.current) {
            clearTimeout(periodicValidationRef.current);
        }

        periodicValidationRef.current = setTimeout(() => {
            if (authState.isAuthenticated) {
                console.log('🔄 Periodic validation triggered');
                validateAuthentication(false);
                startPeriodicValidation();
            }
        }, VALIDATION_INTERVALS.PERIODIC);

        console.log('✅ Started periodic auth validation');
    }, [authState.isAuthenticated, validateAuthentication]);

    const clearAllTimers = useCallback(() => {
        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
            validationTimeoutRef.current = null;
        }
        if (periodicValidationRef.current) {
            clearTimeout(periodicValidationRef.current);
            periodicValidationRef.current = null;
        }
    }, []);

    return {
        validateAuthentication,
        triggerValidation,
        refreshPermissions,
        checkPermissionScope,
        scheduleTokenValidation,
        startPeriodicValidation,
        clearAllTimers
    };
};