// src/presentation/tab/HabitManager/hooks/auth/useAuthValidation.ts

/**
 * 🔐 AUTHENTICATION VALIDATION HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 TỔNG QUAN CHỨC NĂNG:
 * ├── 🔍 Quản lý validation authentication state và token
 * ├── 🎯 Kiểm tra permissions và scope access
 * ├── ⏰ Lên lịch validation tự động và theo thời gian token expiry
 * ├── 🔄 Refresh permissions và kiểm tra scope access
 * └── 🧹 Quản lý cleanup và timers
 * 
 * 🏗️ CẤU TRÚC CHÍNH:
 * ├── Validation Functions     → Validate authentication và token
 * ├── Permission Management   → Kiểm tra và refresh permissions
 * ├── Scheduled Operations    → Lên lịch validation tự động
 * ├── Timer Management        → Quản lý timeout và intervals
 * └── Cleanup Functions       → Dọn dẹp timers và resources
 * 
 * 🔧 CÁC CHỨC NĂNG CHÍNH:
 * ├── validateAuthentication() → Comprehensive auth validation
 * ├── triggerValidation()     → Force validation
 * ├── refreshPermissions()    → Refresh permission status
 * ├── checkPermissionScope()  → Kiểm tra scope cụ thể
 * ├── scheduleTokenValidation() → Lên lịch validation dựa trên token expiry
 * ├── startPeriodicValidation() → Bắt đầu periodic validation
 * └── clearAllTimers()        → Clear all timers và cleanup
 */

// 📚 IMPORTS & TYPES
// ════════════════════════════════════════════════════════════════════════════════

import { useCallback, useRef } from 'react';
import { AuthUtils } from '../../utils/auth/AuthUtils';
import type { EnhancedAuthState, ValidationStatus, PermissionStatus } from './useAuth';

// 🎯 INTERFACE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

interface UseAuthValidationProps {
    authState: EnhancedAuthState;
    authManager: any;
    permissions: PermissionStatus;
    setPermissions: (permissions: PermissionStatus) => void;
    setIsCheckingPermissions: (checking: boolean) => void;
    updateAuthState: (updates: Partial<EnhancedAuthState>) => void;
    updateValidationStatus: (updates: Partial<ValidationStatus>) => void;
}

// ⏰ VALIDATION INTERVALS
// ════════════════════════════════════════════════════════════════════════════════

const VALIDATION_INTERVALS = {
    PERIODIC: 5 * 60 * 1000,           // ⏰ 5 phút
    TOKEN_EXPIRY_BUFFER: 10 * 60 * 1000, // ⏰ 10 minutes buffer
} as const;

// 🏭 MAIN HOOK
// ════════════════════════════════════════════════════════════════════════════════

export const useAuthValidation = ({
    authState,
    authManager,
    permissions,
    setPermissions,
    setIsCheckingPermissions,
    updateAuthState,
    updateValidationStatus
}: UseAuthValidationProps) => {

    // ⏰ TIMER REFERENCES
    // ────────────────────────────────────────────────────────────────────────────
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const periodicValidationRef = useRef<NodeJS.Timeout | null>(null);

    // ========== VALIDATION FUNCTIONS ==========
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * 🔍 Comprehensive authentication validation
     * - Kiểm tra token validity và expiration
     * - Kiểm tra required scopes access
     * - Cập nhật validation status và permissions
     * - Tự động schedule token validation nếu cần
     * @param forceValidation - Bỏ qua cache và validation in progress
     * @returns {Promise<ValidationStatus>} Kết quả validation
     */
    const validateAuthentication = useCallback(async (forceValidation: boolean = false): Promise<ValidationStatus> => {
        // 🚫 Skip nếu đang validation và không force
        if (authState.validationStatus.validationInProgress && !forceValidation) {
            return authState.validationStatus;
        }

        // ⏰ Skip nếu vừa validation gần đây (1 phút)
        const lastValidation = authState.validationStatus.lastValidation;
        if (!forceValidation && lastValidation && (Date.now() - lastValidation < 60000)) {
            return authState.validationStatus;
        }

        console.log('🔄 Starting comprehensive auth validation...');

        // 📊 Update validation state
        updateValidationStatus({ validationInProgress: true });
        updateAuthState({ isValidating: true });

        try {
            // ❌ Check authentication state
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
                updateAuthState({ isValidating: false, canProceed: false });
                return status;
            }

            // ✅ Validate token
            const tokenValidation = await AuthUtils.validateToken(authState.user.accessToken);

            // 🔍 Test all required scopes
            const scopeTestPromises = AuthUtils.getRequiredScopes().map(async (scope) => {
                const scopeName = AuthUtils.getScopeNameFromUrl(scope);
                const hasAccess = await AuthUtils.testScopeAccess(authState.user!.accessToken, scopeName);
                return { [scopeName]: hasAccess };
            });

            const scopeResults = await Promise.all(scopeTestPromises);
            const combinedScopeResults = scopeResults.reduce((acc, result) => ({ ...acc, ...result }), {});
            const hasRequiredScopes = combinedScopeResults.drive && combinedScopeResults.sheets;

            // 📊 Update permissions state
            setPermissions(prev => ({
                ...prev,
                hasDrive: combinedScopeResults.drive || false,
                hasSheets: combinedScopeResults.sheets || false,
                hasCalendar: combinedScopeResults.calendar || false,
                allRequired: hasRequiredScopes,
                checked: true,
                lastChecked: Date.now(),
                checkInProgress: false
            }));

            // 🏗️ Build validation result
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

            // 📤 Update states
            updateValidationStatus(status);
            updateAuthState({
                isValidating: false,
                canProceed: status.isValid && hasRequiredScopes
            });

            // ⏰ Schedule next validation
            scheduleTokenValidation();
            console.log('✅ Auth validation completed:', status);

            return status;

        } catch (error) {
            console.error('❌ Auth validation failed:', error);

            // 🚨 Error handling
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
            updateAuthState({ isValidating: false, canProceed: false });
            return status;
        }
    }, [
        authState.isAuthenticated,
        authState.user?.accessToken,
        authState.validationStatus,
        updateValidationStatus,
        updateAuthState,
        setPermissions
    ]);

    /**
     * 🎯 Trigger force validation
     * @returns {Promise<boolean>} True nếu validation thành công
     */
    const triggerValidation = useCallback(async (): Promise<boolean> => {
        const result = await validateAuthentication(true);
        return result.isValid;
    }, [validateAuthentication]);

    // ========== PERMISSION MANAGEMENT ==========
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * 🔄 Refresh permission status
     * - Kiểm tra tất cả scopes
     * - Cập nhật permission state
     * @returns {Promise<PermissionStatus>} Updated permission status
     */
    const refreshPermissions = useCallback(async (): Promise<PermissionStatus> => {
        if (!authState.user?.accessToken) {
            return permissions;
        }

        // 📊 Update loading state
        setIsCheckingPermissions(true);
        setPermissions(prev => ({ ...prev, checkInProgress: true }));

        try {
            console.log('🔄 Refreshing permission status...');

            // 🔍 Test all scopes
            const scopeTests = await AuthUtils.testAllScopes(authState.user.accessToken);

            // 🏗️ Build permission result
            const newPermissions: PermissionStatus = {
                hasDrive: scopeTests.drive || false,
                hasSheets: scopeTests.sheets || false,
                hasCalendar: scopeTests.calendar || false,
                allRequired: scopeTests.drive && scopeTests.sheets,
                checked: true,
                lastChecked: Date.now(),
                checkInProgress: false
            };

            // 📤 Update permission state
            setPermissions(newPermissions);
            console.log('✅ Permission status refreshed:', newPermissions);

            return newPermissions;

        } catch (error) {
            console.error('❌ Failed to refresh permissions:', error);
            setPermissions(prev => ({ ...prev, checkInProgress: false }));
            return permissions;
        } finally {
            setIsCheckingPermissions(false);
        }
    }, [authState.user?.accessToken, permissions, setPermissions, setIsCheckingPermissions]);

    /**
     * 🔍 Kiểm tra scope cụ thể
     * @param scopeName - Tên scope cần kiểm tra
     * @returns {Promise<boolean>} True nếu có access
     */
    const checkPermissionScope = useCallback(async (scopeName: string): Promise<boolean> => {
        if (!authState.user?.accessToken) return false;

        try {
            return await AuthUtils.testScopeAccess(authState.user.accessToken, scopeName);
        } catch (error) {
            console.warn(`⚠️ Failed to check ${scopeName} scope:`, error);
            return false;
        }
    }, [authState.user?.accessToken]);

    // ========== SCHEDULED OPERATIONS ==========
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * ⏰ Lên lịch token validation dựa trên expiry time
     * - Tính toán thời gian validation trước khi token expire
     * - Tự động trigger validation khi cần
     */
    const scheduleTokenValidation = useCallback(() => {
        // 🧹 Clear existing timeout
        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
        }

        const expiresAt = authState.validationStatus.expiresAt;
        if (expiresAt) {
            // ⏱️ Tính thời gian validation (trước expiry 10 phút)
            const timeUntilExpiry = expiresAt - Date.now();
            const validationDelay = Math.max(60000, timeUntilExpiry - VALIDATION_INTERVALS.TOKEN_EXPIRY_BUFFER);

            // ⏰ Set timeout cho validation
            validationTimeoutRef.current = setTimeout(() => {
                if (authState.isAuthenticated && authState.user?.accessToken) {
                    console.log('⏰ Scheduled token validation triggered');
                    validateAuthentication(true);
                }
            }, validationDelay);

            console.log(`⏰ Scheduled token validation in ${Math.round(validationDelay / 1000)} seconds`);
        }
    }, [authState.validationStatus.expiresAt, authState.isAuthenticated, authState.user?.accessToken, validateAuthentication]);

    /**
     * 🔁 Bắt đầu periodic validation
     * - Validation mỗi 5 phút
     * - Tự động schedule lại sau mỗi lần validation
     */
    const startPeriodicValidation = useCallback(() => {
        // 🧹 Clear existing interval
        if (periodicValidationRef.current) {
            clearTimeout(periodicValidationRef.current);
        }

        // ⏰ Set periodic validation
        periodicValidationRef.current = setTimeout(() => {
            if (authState.isAuthenticated) {
                console.log('🔄 Periodic validation triggered');
                validateAuthentication(false);
                startPeriodicValidation(); // 🔁 Recursive scheduling
            }
        }, VALIDATION_INTERVALS.PERIODIC);

        console.log('✅ Started periodic auth validation');
    }, [authState.isAuthenticated, validateAuthentication]);

    /**
     * 🧹 Clear all timers và cleanup
     */
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

    // 🎯 RETURN HOOK FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════

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