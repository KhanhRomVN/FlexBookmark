// src/presentation/tab/TaskManager/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import ChromeAuthManager from "../../../../utils/chromeAuth";
import type { AuthState } from "../../../../utils/chromeAuth";

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });

    const authManager = ChromeAuthManager.getInstance();

    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState: AuthState) => {
            setAuthState(newState);
        });
        authManager.initialize();
        return unsubscribe;
    }, [authManager]);

    const getFreshToken = useCallback(async (): Promise<string> => {
        try {
            const token = authState.user?.accessToken;
            if (token) {
                await new Promise<void>((resolve) =>
                    chrome.identity.removeCachedAuthToken({ token }, () => resolve())
                );
            }
            const user = await authManager.login();
            return user.accessToken;
        } catch (error) {
            console.error("Failed to get fresh token:", error);
            throw error;
        }
    }, [authState.user?.accessToken, authManager]);

    return {
        authState,
        getFreshToken,
    };
}
