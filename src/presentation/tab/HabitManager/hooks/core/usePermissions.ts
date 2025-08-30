import { useState, useEffect, useCallback } from 'react';
import { useCache } from './useCache';
import { CACHE_KEYS, CACHE_TTL } from '../../utils/cache/CacheKeys';
import ChromeAuthManager from '../../../../../utils/chromeAuth';
import { useAuth } from './useAuth';

interface Permissions {
    hasDrive: boolean;
    hasSheets: boolean;
    hasCalendar: boolean;
    allRequired: boolean;
    checked: boolean;
}

interface PermissionCheckResult {
    hasDrive: boolean;
    hasSheets: boolean;
    hasCalendar: boolean;
    allRequired: boolean;
}

export const usePermissions = () => {
    const [permissions, setPermissions] = useState<Permissions>({
        hasDrive: false,
        hasSheets: false,
        hasCalendar: false,
        allRequired: false,
        checked: false,
    });

    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { getCache, setCache } = useCache();
    const { authState, authManager } = useAuth();

    // Required scopes for the application
    const REQUIRED_SCOPES = {
        drive: 'https://www.googleapis.com/auth/drive.file',
        sheets: 'https://www.googleapis.com/auth/spreadsheets',
        calendar: 'https://www.googleapis.com/auth/calendar.events.readonly'
    };

    // Check if specific scope is granted
    const checkScope = useCallback(async (scope: string): Promise<boolean> => {
        try {
            console.log(`🔍 Checking scope: ${scope}`);

            if (!authState.isAuthenticated || !authState.user?.accessToken) {
                console.log(`❌ Not authenticated for scope: ${scope}`);
                return false;
            }

            // Test API access for the specific scope
            let testUrl: string;

            switch (scope) {
                case REQUIRED_SCOPES.drive:
                    testUrl = 'https://www.googleapis.com/drive/v3/files?pageSize=1';
                    break;
                case REQUIRED_SCOPES.sheets:
                    testUrl = 'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest';
                    break;
                case REQUIRED_SCOPES.calendar:
                    testUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary';
                    break;
                default:
                    console.log(`❌ Unknown scope: ${scope}`);
                    return false;
            }

            console.log(`📡 Testing API endpoint: ${testUrl}`);

            const response = await fetch(testUrl, {
                headers: {
                    'Authorization': `Bearer ${authState.user.accessToken}`,
                },
            });

            const result = response.ok;
            console.log(`${result ? '✅' : '❌'} Scope ${scope} check result: ${result} (status: ${response.status})`);

            return result;
        } catch (error) {
            console.warn(`❌ Failed to check scope ${scope}:`, error);
            return false;
        }
    }, [authState.isAuthenticated, authState.user?.accessToken, REQUIRED_SCOPES]);

    // Comprehensive permission check
    const checkPermissions = useCallback(async (useCache: boolean = true): Promise<PermissionCheckResult> => {
        try {
            console.log('🚀 Starting permission check...', { useCache, checking });

            if (checking) {
                console.log('⏳ Permission check already in progress, returning current state...');
                return {
                    hasDrive: permissions.hasDrive,
                    hasSheets: permissions.hasSheets,
                    hasCalendar: permissions.hasCalendar,
                    allRequired: permissions.allRequired
                };
            }

            setChecking(true);
            setError(null);

            // Try to get cached permissions first
            if (useCache) {
                const cachedPermissions = await getCache<PermissionCheckResult>(CACHE_KEYS.PERMISSIONS);
                if (cachedPermissions) {
                    console.log('📋 Using cached permissions:', cachedPermissions);

                    // Update state immediately with cached permissions and mark as checked
                    setPermissions({
                        ...cachedPermissions,
                        checked: true
                    });

                    return cachedPermissions;
                }
            }

            console.log('🔍 Checking permissions from API...');

            // Check each required scope
            console.log('📡 Starting API permission checks...');
            const [hasDrive, hasSheets, hasCalendar] = await Promise.all([
                checkScope(REQUIRED_SCOPES.drive),
                checkScope(REQUIRED_SCOPES.sheets),
                checkScope(REQUIRED_SCOPES.calendar)
            ]);

            console.log('📊 Individual permission results:', { hasDrive, hasSheets, hasCalendar });

            const result: PermissionCheckResult = {
                hasDrive,
                hasSheets,
                hasCalendar,
                allRequired: hasDrive && hasSheets // Calendar is optional
            };

            console.log('📋 Final permission check result:', result);

            // Cache the result
            console.log('💾 Caching permission result...');
            await setCache(CACHE_KEYS.PERMISSIONS, result, CACHE_TTL.PERMISSIONS);

            // Update local state with checked: true
            setPermissions({
                ...result,
                checked: true
            });

            console.log('✅ Permission check completed successfully');
            return result;

        } catch (error) {
            console.error('❌ Permission check failed:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setError(`Permission check failed: ${errorMessage}`);

            // Return minimal permissions on error
            const fallbackResult: PermissionCheckResult = {
                hasDrive: false,
                hasSheets: false,
                hasCalendar: false,
                allRequired: false
            };

            // Mark as checked even on error to prevent infinite loops
            setPermissions({
                ...fallbackResult,
                checked: true
            });

            return fallbackResult;
        } finally {
            console.log('🏁 Permission check cleanup, setting checking to false');
            setChecking(false);
        }
    }, [getCache, setCache, checkScope, checking, permissions.hasDrive, permissions.hasSheets, permissions.hasCalendar, permissions.allRequired]);

    // Force refresh permissions (bypass cache)
    const refreshPermissions = useCallback(async (): Promise<PermissionCheckResult> => {
        console.log('🔄 Force refreshing permissions...');
        return checkPermissions(false);
    }, [checkPermissions]);

    // Request additional permissions
    const requestPermissions = useCallback(async (scopes: string[]): Promise<boolean> => {
        try {
            setChecking(true);
            setError(null);

            console.log('📝 Requesting additional permissions:', scopes);

            // Use the auth manager to request additional scopes
            await authManager.requestAdditionalScopes(scopes);

            // Recheck permissions after granting
            const updatedPermissions = await refreshPermissions();

            return updatedPermissions.allRequired;

        } catch (error) {
            console.error('❌ Failed to request additional permissions:', error);

            const errorMessage = error instanceof Error ? error.message : 'Permission request failed';
            setError(errorMessage);

            return false;
        } finally {
            setChecking(false);
        }
    }, [authManager, refreshPermissions]);

    // Request all required permissions
    const requestAllRequiredPermissions = useCallback(async (): Promise<boolean> => {
        const missingScopes: string[] = [];

        if (!permissions.hasDrive) {
            missingScopes.push(REQUIRED_SCOPES.drive);
        }
        if (!permissions.hasSheets) {
            missingScopes.push(REQUIRED_SCOPES.sheets);
        }

        if (missingScopes.length === 0) {
            return true;
        }

        return requestPermissions(missingScopes);
    }, [permissions, requestPermissions]);

    // Get permission status summary
    const getPermissionSummary = useCallback(() => {
        return {
            total: 2, // Drive + Sheets (Calendar optional)
            granted: [permissions.hasDrive, permissions.hasSheets].filter(Boolean).length,
            missing: [
                ...(!permissions.hasDrive ? ['Google Drive'] : []),
                ...(!permissions.hasSheets ? ['Google Sheets'] : [])
            ],
            optional: {
                calendar: permissions.hasCalendar
            }
        };
    }, [permissions]);

    // FIXED: Simplified auto-check effect that only runs once per auth state change
    useEffect(() => {
        let mounted = true; // Prevent state updates if component unmounted

        const runPermissionCheck = async () => {
            if (!mounted) return;

            console.log('🔄 Permission check effect triggered:', {
                isAuthenticated: authState.isAuthenticated,
                hasUser: !!authState.user,
                permissionsChecked: permissions.checked,
                currentlyChecking: checking
            });

            // Only trigger if authenticated, has user, not already checked, and not currently checking
            const shouldCheck = authState.isAuthenticated &&
                authState.user &&
                !permissions.checked &&
                !checking;

            if (shouldCheck) {
                console.log('✅ Conditions met, starting permission check...');
                try {
                    await checkPermissions();
                } catch (error) {
                    console.error('❌ Auto permission check failed:', error);
                    if (mounted) {
                        setPermissions(prev => ({ ...prev, checked: true }));
                    }
                }
            } else {
                console.log('⏸️ Permission check conditions not met:', {
                    notAuthenticated: !authState.isAuthenticated,
                    noUser: !authState.user,
                    alreadyChecked: permissions.checked,
                    currentlyChecking: checking
                });
            }
        };

        runPermissionCheck();

        return () => {
            mounted = false;
        };
    }, [authState.isAuthenticated, authState.user?.accessToken]); // ONLY depend on auth state changes

    // Subscribe to auth state changes
    useEffect(() => {
        console.log('🔗 Setting up auth state subscription...');

        const unsubscribe = authManager.subscribe((newAuthState) => {
            console.log('🔔 Auth state changed:', {
                isAuthenticated: newAuthState.isAuthenticated,
                hasUser: !!newAuthState.user
            });

            if (!newAuthState.isAuthenticated) {
                console.log('🚪 User logged out, resetting permissions...');
                // Reset permissions when user logs out
                setPermissions({
                    hasDrive: false,
                    hasSheets: false,
                    hasCalendar: false,
                    allRequired: false,
                    checked: false
                });
                setError(null);
            }
        });

        return () => {
            console.log('🔌 Unsubscribing from auth state changes');
            unsubscribe();
        };
    }, [authManager]);

    // Log whenever permissions state changes
    useEffect(() => {
        console.log('🔄 Permissions state changed:', permissions);
    }, [permissions]);

    return {
        // State
        permissions,
        checking,
        error,

        // Actions
        checkPermissions,
        refreshPermissions,
        requestPermissions,
        requestAllRequiredPermissions,

        // Computed
        getPermissionSummary,

        // Constants
        REQUIRED_SCOPES
    };
};