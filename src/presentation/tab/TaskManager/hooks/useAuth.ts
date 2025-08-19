import { useState, useEffect, useCallback, useRef } from "react";
import ChromeAuthManager from "../../../../utils/chromeAuth";
import type { AuthState } from "../../../../utils/chromeAuth";
import { AdvancedCache } from "./useCache";

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });

    const authManager = ChromeAuthManager.getInstance();
    const cache = useRef(new AdvancedCache<string>());

    useEffect(() => {
        const unsubscribe = authManager.subscribe((newState: AuthState) => {
            setAuthState(newState);
        });
        authManager.initialize();
        return unsubscribe;
    }, [authManager]);

    const getFreshToken = useCallback(async (): Promise<string> => {
        const cacheKey = 'fresh_token';
        const cached = cache.current.get(cacheKey);
        if (cached) return cached;

        try {
            if (authState.user?.accessToken) {
                await new Promise<void>((resolve) =>
                    chrome.identity.removeCachedAuthToken(
                        { token: authState.user!.accessToken },
                        () => resolve()
                    )
                );
            }
            const user = await authManager.login();
            cache.current.set(cacheKey, user.accessToken, 30 * 60 * 1000); // 30 min cache
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
