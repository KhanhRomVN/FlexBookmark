import { useState, useEffect } from 'react';
import ChromeAuthManager, { AuthState, User } from '../utils/chromeAuth';

export interface UseAuthReturn {
    authState: AuthState;
    login: () => Promise<User>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string>;
    isLoading: boolean;
    isAuthenticated: boolean;
    user: User | null;
    error: string | null;
}

/**
 * React hook for Chrome Identity authentication
 */
export const useAuth = (): UseAuthReturn => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null
    });

    const authManager = ChromeAuthManager.getInstance();

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = authManager.subscribe((newState) => {
            setAuthState(newState);
        });

        // Initialize authentication
        authManager.initialize();

        return unsubscribe;
    }, [authManager]);

    const login = async (): Promise<User> => {
        try {
            return await authManager.login();
        } catch (error) {
            console.error('Login error in hook:', error);
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await authManager.logout();
        } catch (error) {
            console.error('Logout error in hook:', error);
            throw error;
        }
    };

    const refreshToken = async (): Promise<string> => {
        try {
            return await authManager.refreshToken();
        } catch (error) {
            console.error('Token refresh error in hook:', error);
            throw error;
        }
    };

    return {
        authState,
        login,
        logout,
        refreshToken,
        isLoading: authState.loading,
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        error: authState.error
    };
};

export default useAuth;