// 🔐 TOKEN MANAGEMENT HOOK
// ═══════════════════════════════════════════════════════════════════════════════
// 
// 📋 TỔNG QUAN CHỨC NĂNG:
// ├── 🔄 Quản lý refresh token tự động và thủ công
// ├── ⏰ Theo dõi thời gian hết hạn token
// ├── 🔍 Kiểm tra tính hợp lệ của token
// ├── 🚫 Xử lý revoke token
// └── 🔄 Tự động refresh token khi sắp hết hạn
// 
// 🏗️ CẤU TRÚC CHÍNH:
// ├── Token Refresh Logic     → Xử lý refresh token
// ├── Expiry Management       → Quản lý thời gian hết hạn
// ├── Validation Helpers      → Helper kiểm tra token
// ├── Auto-Refresh Logic      → Tự động refresh khi cần
// └── Utility Functions       → Các hàm tiện ích
// 
// 🔧 CÁC CHỨC NĂNG CHÍNH:
// ├── refreshAccessToken()    → Refresh token với retry logic
// ├── shouldRefreshToken()    → Kiểm tra có cần refresh không
// ├── getTokenExpiryInfo()    → Lấy thông tin thời gian hết hạn
// ├── forceTokenRefresh()     → Buộc refresh token
// ├── revokeToken()           → Revoke token hiện tại
// ├── isTokenValid()          → Kiểm tra token hợp lệ
// ├── needsTokenRefresh()     → Kiểm tra cần refresh
// └── autoRefreshIfNeeded()   → Tự động refresh nếu cần

import { useState, useCallback, useRef } from 'react';
import { AuthUtils } from '../../utils/auth/AuthUtils';
import type { EnhancedAuthState, ValidationStatus } from './useAuth';

export interface TokenRefreshResult {
    success: boolean;
    newToken?: string;
    expiresAt?: number;
    error?: string;
}

interface UseTokenManagementProps {
    authState: EnhancedAuthState;
    authManager: any;
    updateAuthState: (updates: Partial<EnhancedAuthState>) => void;
    updateValidationStatus: (updates: Partial<ValidationStatus>) => void;
}

// ⚙️ CONFIGURATION CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════

const MAX_RETRY_ATTEMPTS = 3;
const TOKEN_REFRESH_TIMEOUT = 30000; // ⏱️ 30 giây timeout
const TOKEN_EXPIRY_BUFFER = 10 * 60 * 1000; // ⏰ 10 phút buffer trước khi hết hạn

export const useTokenManagement = ({
    authState,
    authManager,
    updateAuthState,
    updateValidationStatus
}: UseTokenManagementProps) => {

    // 📊 STATE MANAGEMENT
    // ────────────────────────────────────────────────────────────────────────────
    const [tokenRefreshAttempts, setTokenRefreshAttempts] = useState(0);
    const tokenRefreshPromiseRef = useRef<Promise<TokenRefreshResult> | null>(null);
    const retryCountRef = useRef<number>(0);

    // ========== TOKEN REFRESH ==========

    /**
     * 🔄 Refresh access token với retry logic và timeout protection
     * - Ngăn chặn multiple simultaneous refresh attempts
     * - Xử lý timeout và validation errors
     * - Cập nhật auth state và validation status
     * @returns {Promise<TokenRefreshResult>} Kết quả refresh
     */
    const refreshAccessToken = useCallback(async (): Promise<TokenRefreshResult> => {
        // 🚫 Prevent multiple simultaneous refresh attempts
        if (tokenRefreshPromiseRef.current) {
            return tokenRefreshPromiseRef.current;
        }

        // 🚨 Check maximum retry attempts
        if (tokenRefreshAttempts >= MAX_RETRY_ATTEMPTS) {
            return {
                success: false,
                error: 'Maximum token refresh attempts exceeded'
            };
        }

        console.log('🔄 Starting access token refresh...');

        const refreshPromise = (async (): Promise<TokenRefreshResult> => {
            try {
                updateAuthState({ tokenRefreshInProgress: true });
                setTokenRefreshAttempts(prev => prev + 1);

                // 🎫 Use Chrome Identity API để lấy token mới
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Token refresh timeout')), TOKEN_REFRESH_TIMEOUT);
                });

                const refreshPromise = new Promise<string>((resolve, reject) => {
                    chrome.identity.getAuthToken({ interactive: false }, (token) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }
                        if (!token) {
                            reject(new Error('No token received'));
                            return;
                        }
                        resolve(token);
                    });
                });

                const newToken = await Promise.race([refreshPromise, timeoutPromise]);

                // ✅ Validate token mới
                const validation = await AuthUtils.validateToken(newToken);

                if (!validation.isValid) {
                    throw new Error(`Token validation failed: ${validation.errors.join(', ')}`);
                }

                // 🔄 Update auth manager và state
                await authManager.updateToken(newToken);

                updateAuthState({
                    lastTokenRefresh: Date.now(),
                    tokenRefreshInProgress: false
                });

                updateValidationStatus({
                    isValid: true,
                    hasValidToken: true,
                    expiresAt: validation.expiresAt,
                    lastValidation: Date.now(),
                    errors: []
                });

                setTokenRefreshAttempts(0);
                retryCountRef.current = 0;

                console.log('✅ Access token refreshed successfully');

                return {
                    success: true,
                    newToken,
                    expiresAt: validation.expiresAt || undefined
                };

            } catch (error) {
                console.error('❌ Token refresh failed:', error);

                updateAuthState({ tokenRefreshInProgress: false });

                const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';

                return {
                    success: false,
                    error: errorMessage
                };
            } finally {
                tokenRefreshPromiseRef.current = null;
            }
        })();

        tokenRefreshPromiseRef.current = refreshPromise;
        return refreshPromise;
    }, [authManager, tokenRefreshAttempts, updateAuthState, updateValidationStatus]);

    // ========== TOKEN VALIDATION HELPERS ==========

    /**
     * 🔍 Kiểm tra có cần refresh token không dựa trên thời gian hết hạn
     * @returns {boolean} True nếu cần refresh
     */
    const shouldRefreshToken = useCallback((): boolean => {
        const { expiresAt } = authState.validationStatus;
        if (!expiresAt) return false;

        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        return timeUntilExpiry <= TOKEN_EXPIRY_BUFFER;
    }, [authState.validationStatus.expiresAt]);

    /**
     * 📊 Lấy thông tin chi tiết về thời gian hết hạn token
     * @returns {Object | null} Thông tin expiry hoặc null
     */
    const getTokenExpiryInfo = useCallback(() => {
        const { expiresAt } = authState.validationStatus;
        if (!expiresAt) return null;

        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);

        return {
            expiresAt,
            timeUntilExpiry,
            minutesUntilExpiry,
            isExpiringSoon: timeUntilExpiry <= TOKEN_EXPIRY_BUFFER,
            isExpired: timeUntilExpiry <= 0
        };
    }, [authState.validationStatus.expiresAt]);

    // ========== TOKEN MANAGEMENT UTILITIES ==========

    /**
     * ⚡ Buộc refresh token (bỏ qua các điều kiện thông thường)
     * @returns {Promise<boolean>} True nếu thành công
     */
    const forceTokenRefresh = useCallback(async (): Promise<boolean> => {
        try {
            console.log('⚡ Forcing token refresh...');

            // 🔄 Reset retry counter cho forced refresh
            setTokenRefreshAttempts(0);
            retryCountRef.current = 0;

            const result = await refreshAccessToken();
            return result.success;

        } catch (error) {
            console.error('❌ Force token refresh failed:', error);
            return false;
        }
    }, [refreshAccessToken]);

    /**
     * 🚫 Revoke token hiện tại
     * @returns {Promise<boolean>} True nếu thành công
     */
    const revokeToken = useCallback(async (): Promise<boolean> => {
        try {
            if (!authState.user?.accessToken) return false;

            console.log('🚫 Revoking access token...');
            const success = await AuthUtils.revokeToken(authState.user.accessToken);

            if (success) {
                updateAuthState({
                    tokenRefreshInProgress: false,
                    lastTokenRefresh: null
                });

                updateValidationStatus({
                    isValid: false,
                    hasValidToken: false,
                    hasRequiredScopes: false,
                    needsReauth: true,
                    lastValidation: Date.now(),
                    expiresAt: null,
                    errors: ['Token revoked'],
                    validationInProgress: false
                });

                console.log('✅ Token revoked successfully');
            }

            return success;

        } catch (error) {
            console.error('❌ Token revocation failed:', error);
            return false;
        }
    }, [authState.user?.accessToken, updateAuthState, updateValidationStatus]);

    // ========== TOKEN STATUS CHECKS ==========

    /**
     * ✅ Kiểm tra token có hợp lệ không
     * @returns {boolean} True nếu token hợp lệ
     */
    const isTokenValid = useCallback((): boolean => {
        return authState.validationStatus.isValid &&
            authState.validationStatus.hasValidToken &&
            !authState.validationStatus.needsReauth;
    }, [authState.validationStatus]);

    /**
     * 🔍 Kiểm tra có cần refresh token không
     * @returns {boolean} True nếu cần refresh
     */
    const needsTokenRefresh = useCallback((): boolean => {
        const expiryInfo = getTokenExpiryInfo();
        return expiryInfo?.isExpiringSoon || false;
    }, [getTokenExpiryInfo]);

    // ========== AUTO-REFRESH LOGIC ==========

    /**
     * 🤖 Tự động refresh token nếu cần thiết
     * @returns {Promise<boolean>} True nếu refresh thành công hoặc không cần
     */
    const autoRefreshIfNeeded = useCallback(async (): Promise<boolean> => {
        if (!shouldRefreshToken()) {
            return true; // ✅ No refresh needed
        }

        if (authState.tokenRefreshInProgress) {
            return false; // 🔄 Already refreshing
        }

        console.log('🤖 Auto-refreshing token due to expiry...');
        const result = await refreshAccessToken();

        return result.success;
    }, [shouldRefreshToken, authState.tokenRefreshInProgress, refreshAccessToken]);

    // 🎯 RETURN ALL FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════════════

    return {
        refreshAccessToken,
        shouldRefreshToken,
        tokenRefreshAttempts,
        setTokenRefreshAttempts,
        getTokenExpiryInfo,
        forceTokenRefresh,
        revokeToken,
        isTokenValid,
        needsTokenRefresh,
        autoRefreshIfNeeded
    };
};