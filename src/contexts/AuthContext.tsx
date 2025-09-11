import React, { createContext, useContext, useEffect, useState } from "react";
import ChromeAuthManager, {
  AuthState,
  PermissionCheckResult,
} from "../utils/chromeAuth";

interface AuthContextType {
  authState: AuthState;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  checkPermissions: () => Promise<PermissionCheckResult>;
  getFreshToken: () => Promise<string>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      const authManager = ChromeAuthManager.getInstance();

      unsubscribe = authManager.subscribe(async (newAuthState) => {
        setAuthState({
          ...newAuthState,
          isAuthenticated: !!newAuthState.user?.accessToken,
          error: newAuthState.error,
        });
      });

      await authManager.initialize();
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const initialize = async (): Promise<void> => {
    const authManager = ChromeAuthManager.getInstance();
    await authManager.initialize();
  };

  const login = async (): Promise<boolean> => {
    if (isRefreshing) {
      console.log("Already refreshing auth, waiting...");
      return false;
    }

    try {
      setIsRefreshing(true);
      setAuthState((prev) => ({ ...prev, error: null, loading: true }));

      console.log("Starting login process...");

      // Clear any cached tokens first
      if (chrome?.identity) {
        await new Promise<void>((resolve) => {
          chrome.identity.clearAllCachedAuthTokens(() => {
            console.log("Cleared cached tokens");
            resolve();
          });
        });
      }

      // Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));

      const authManager = ChromeAuthManager.getInstance();

      // Get fresh token with interactive mode - FIXED: proper scopes array
      const token = await new Promise<string>((resolve, reject) => {
        console.log("Requesting interactive token...");

        chrome.identity.getAuthToken(
          {
            interactive: true,
            scopes: [
              "openid",
              "email",
              "profile",
              "https://www.googleapis.com/auth/tasks",
              "https://www.googleapis.com/auth/drive.file",
              "https://www.googleapis.com/auth/spreadsheets",
            ],
          },
          (token) => {
            if (chrome.runtime.lastError) {
              console.error("Chrome identity error:", chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
            } else if (token) {
              console.log("Token received successfully");
              resolve(token);
            } else {
              console.error("No token received from Chrome identity");
              reject(new Error("No token received from Chrome identity"));
            }
          }
        );
      });

      console.log("Processing token...");
      await authManager.handleNewToken(token);

      setAuthState((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      setAuthState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
        loading: false,
      }));
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    if (isRefreshing) return false;

    try {
      setIsRefreshing(true);
      console.log("Attempting non-interactive token refresh...");

      // Try non-interactive first
      const token = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken(
          {
            interactive: false,
            scopes: [
              "openid",
              "email",
              "profile",
              "https://www.googleapis.com/auth/tasks",
              "https://www.googleapis.com/auth/drive.file",
              "https://www.googleapis.com/auth/spreadsheets",
            ],
          },
          (token) => {
            if (chrome.runtime.lastError || !token) {
              reject(new Error("No cached token available"));
            } else {
              resolve(token);
            }
          }
        );
      });

      const authManager = ChromeAuthManager.getInstance();
      await authManager.handleNewToken(token);
      console.log("Token refresh successful");
      return true;
    } catch (error) {
      console.log("Non-interactive refresh failed:", error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      // Clear Chrome identity tokens
      if (chrome?.identity && authState.user?.accessToken) {
        await new Promise<void>((resolve) => {
          chrome.identity.removeCachedAuthToken(
            { token: authState.user!.accessToken! },
            () => {
              resolve();
            }
          );
        });
      }

      const authManager = ChromeAuthManager.getInstance();
      await authManager.logout();

      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Logout error:", error);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: "Logout failed",
      }));
    }
  };

  const checkPermissions = async (): Promise<PermissionCheckResult> => {
    try {
      const authManager = ChromeAuthManager.getInstance();
      return await authManager.getPermissionStatus();
    } catch (error) {
      console.error("Permission check failed:", error);
      return {
        hasRequiredScopes: false,
        hasDriveAccess: false,
        hasSheetsAccess: false,
        hasTasksAccess: false,
        error:
          error instanceof Error ? error.message : "Permission check failed",
      };
    }
  };

  const getFreshToken = async (): Promise<string> => {
    // If we have a current token and not refreshing, try to use it
    if (authState.user?.accessToken && !isRefreshing) {
      // Verify token is still valid by making a simple API call
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v1/tokeninfo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `access_token=${authState.user.accessToken}`,
          }
        );

        if (response.ok) {
          return authState.user.accessToken;
        }
      } catch (error) {
        console.log("Current token validation failed, will refresh");
      }
    }

    // Try to refresh non-interactively first
    const refreshed = await refreshAuth();
    if (refreshed && authState.user?.accessToken) {
      return authState.user.accessToken;
    }

    // If that fails, do interactive login
    console.log("Non-interactive refresh failed, trying interactive login");
    const success = await login();
    if (!success || !authState.user?.accessToken) {
      throw new Error(
        "Failed to get fresh token - user authentication required"
      );
    }

    return authState.user.accessToken;
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        initialize,
        checkPermissions,
        getFreshToken,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
