import React, { createContext, useContext, useEffect, useState } from "react";
import ChromeAuthManager from "../utils/chromeAuth";
import { AuthState, PermissionCheckResult } from "../utils/chromeAuth";

interface AuthContextType {
  authState: AuthState;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  checkPermissions: () => Promise<PermissionCheckResult>;
  reauthWithAllPermissions: () => Promise<boolean>;
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

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const authManager = ChromeAuthManager.getInstance();
    const unsubscribe = authManager.subscribe(async (newAuthState) => {
      // If user is authenticated, check permissions via API call
      if (newAuthState.isAuthenticated && newAuthState.user?.accessToken) {
        try {
          const permissionStatus = await authManager.getPermissionStatus();
          const hasRequiredPermissions =
            permissionStatus.hasRequiredScopes &&
            permissionStatus.hasDriveAccess &&
            permissionStatus.hasSheetsAccess &&
            permissionStatus.hasCalendarAccess;

          setAuthState({
            ...newAuthState,
            isAuthenticated: hasRequiredPermissions,
            error: hasRequiredPermissions
              ? null
              : "Missing required permissions. Please re-authenticate to grant all necessary permissions.",
          });
        } catch (error) {
          console.error("Permission check failed:", error);
          setAuthState({
            ...newAuthState,
            error:
              "Failed to verify permissions. Please try re-authenticating.",
          });
        }
      } else {
        setAuthState(newAuthState);
      }
    });
    await authManager.initialize();
    return unsubscribe;
  };

  const login = async () => {
    const authManager = ChromeAuthManager.getInstance();
    // Clear any existing tokens to force re-auth with all scopes
    await authManager.clearAllCachedTokens();
    return await authManager.login();
  };

  const logout = async () => {
    const authManager = ChromeAuthManager.getInstance();
    await authManager.logout();
  };

  const checkPermissions = async () => {
    const authManager = ChromeAuthManager.getInstance();
    return await authManager.getPermissionStatus();
  };

  const reauthWithAllPermissions = async () => {
    const authManager = ChromeAuthManager.getInstance();
    return await authManager.reauthWithAllPermissions();
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        initialize,
        checkPermissions,
        reauthWithAllPermissions,
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
