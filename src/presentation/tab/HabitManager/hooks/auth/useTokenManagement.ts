// src/presentation/tab/HabitManager/hooks/auth/useTokenManagement.ts

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

const MAX_RETRY_ATTEMPTS = 3;
const TOKEN_REFRESH_TIMEOUT = 30000; // 30 seconds
const TOKEN_EXPIRY_BUFFER = 10 * 60 * 1000; // 10 minutes

export const useTokenManagement = ({
    authState,
    authManager,
    updateAuthState,
    updateValidationStatus
}: UseTokenManagementProps) => {

    const [tokenRefreshAttempts, setTokenRefreshAttempts] = useState(0);
    const tokenRefreshPromiseRef = useRef<Promise<TokenRefreshResult> | null>(null);
    const retryCountRef = useRef<number>(0);

    // ========== TOKEN REFRESH ==========

    const refreshAccessToken = useCallback(async (): Promise<TokenRefreshResult> => {
        // Prevent multiple simultaneous refresh attempts
        if (tokenRefreshPromiseRef.current) {
            return tokenRefreshPromiseRef.current;
        }

        if (tokenRefreshAttempts >= MAX_RETRY_ATTEMPTS) {
            return {
                success: false,
                error: 'Maximum token refresh attempts exceeded'
            };
        }

        console.log('Starting access token refresh...');

        const refreshPromise = (async (): Promise<TokenRefreshResult> => {
            try {
                updateAuthState({ tokenRefreshInProgress: true });
                setTokenRefreshAttempts(prev => prev + 1);

                // Use Chrome Identity API to get fresh token
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

                // Validate new token
                const validation = await AuthUtils.validateToken(newToken);

                if (!validation.isValid) {
                    throw new Error(`Token validation failed: ${validation.errors.join(', ')}`);
                }

                // Update auth manager and state
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

                console.log('Access token refreshed successfully');

                return {
                    success: true,
                    newToken,
                    expiresAt: validation.expiresAt || undefined
                };

            } catch (error) {
                console.error('Token refresh failed:', error);

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

    const shouldRefreshToken = useCallback((): boolean => {
        const { expiresAt } = authState.validationStatus;
        if (!expiresAt) return false;

        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        return timeUntilExpiry <= TOKEN_EXPIRY_BUFFER;
    }, [authState.validationStatus.expiresAt]);

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

    const forceTokenRefresh = useCallback(async (): Promise<boolean> => {
        try {
            console.log('Forcing token refresh...');

            // Reset retry counter for forced refresh
            setTokenRefreshAttempts(0);
            retryCountRef.current = 0;

            const result = await refreshAccessToken();
            return result.success;

        } catch (error) {
            console.error('Force token refresh failed:', error);
            return false;
        }
    }, [refreshAccessToken]);

    const revokeToken = useCallback(async (): Promise<boolean> => {
        try {
            if (!authState.user?.accessToken) return false;

            console.log('Revoking access token...');
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

                console.log('Token revoked successfully');
            }

            return success;

        } catch (error) {
            console.error('Token revocation failed:', error);
            return false;
        }
    }, [authState.user?.accessToken, updateAuthState, updateValidationStatus]);

    // ========== TOKEN STATUS CHECKS ==========

    const isTokenValid = useCallback((): boolean => {
        return authState.validationStatus.isValid &&
            authState.validationStatus.hasValidToken &&
            !authState.validationStatus.needsReauth;
    }, [authState.validationStatus]);

    const needsTokenRefresh = useCallback((): boolean => {
        const expiryInfo = getTokenExpiryInfo();
        return expiryInfo?.isExpiringSoon || false;
    }, [getTokenExpiryInfo]);

    // ========== AUTO-REFRESH LOGIC ==========

    const autoRefreshIfNeeded = useCallback(async (): Promise<boolean> => {
        if (!shouldRefreshToken()) {
            return true; // No refresh needed
        }

        if (authState.tokenRefreshInProgress) {
            return false; // Already refreshing
        }

        console.log('Auto-refreshing token due to expiry...');
        const result = await refreshAccessToken();

        return result.success;
    }, [shouldRefreshToken, authState.tokenRefreshInProgress, refreshAccessToken]);

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