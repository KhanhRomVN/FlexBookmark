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

  // Check if user has all required scopes
  const hasAllRequiredScopes = (scopes: string[]): boolean => {
    const requiredScopes = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/tasks",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
    ];

    return requiredScopes.every((scope) => scopes.includes(scope));
  };

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const authManager = ChromeAuthManager.getInstance();
    const unsubscribe = authManager.subscribe((newAuthState) => {
      // Check if we have all required scopes when authenticated
      if (newAuthState.isAuthenticated && newAuthState.user) {
        const hasAllScopes = hasAllRequiredScopes(
          newAuthState.user.scopes || []
        );
        setAuthState({
          ...newAuthState,
          isAuthenticated: hasAllScopes,
          error: hasAllScopes
            ? null
            : "Missing required permissions. Please re-authenticate to grant all necessary permissions.",
        });
      } else {
        setAuthState(newAuthState);
      }
    });
    await authManager.initialize();
    return unsubscribe;
  };

  // Modified login to always request all scopes
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
    // Clear cached tokens and reauthenticate with all scopes
    await authManager.clearAllCachedTokens();
    return await authManager.login();
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
