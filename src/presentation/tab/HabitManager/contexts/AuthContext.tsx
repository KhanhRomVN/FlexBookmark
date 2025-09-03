// src/presentation/tab/HabitManager/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import ChromeAuthManager from "../../../../utils/chromeAuth";
import { useAuthValidation } from "../hooks/auth/useAuthValidation";
import { useTokenManagement } from "../hooks/auth/useTokenManagement";
import {
  AuthContextValue,
  EnhancedAuthState,
  ValidationStatus,
  PermissionStatus,
  AuthOperationResult,
  AuthStatus,
  AuthDiagnosticResult,
} from "./types";

// 📚 INTERFACES & TYPES
// ════════════════════════════════════════════════════════════════════════════════

interface AuthState extends EnhancedAuthState {
  validationStatus: ValidationStatus;
  permissions: PermissionStatus;
  isCheckingPermissions: boolean;
  permissionStatus?: PermissionStatus;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_AUTH_STATE"; payload: Partial<AuthState> }
  | { type: "SET_VALIDATION_STATUS"; payload: Partial<ValidationStatus> }
  | { type: "SET_PERMISSIONS"; payload: Partial<PermissionStatus> }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_STATE" };

// 🎯 INITIAL STATE
// ════════════════════════════════════════════════════════════════════════════════

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  isValidating: false,
  canProceed: false,
  lastValidation: null,
  tokenRefreshInProgress: false,
  lastTokenRefresh: null,
  isReady: false,
  validationStatus: {
    isValid: false,
    hasValidToken: false,
    hasRequiredScopes: false,
    needsReauth: false,
    lastValidation: null,
    expiresAt: null,
    errors: [],
    validationInProgress: false,
    isExpired: false,
    grantedScopes: [],
  },
  permissions: {
    hasDrive: false,
    hasSheets: false,
    hasCalendar: false,
    allRequired: false,
    folderStructureExists: false,
    checked: false,
    lastChecked: null,
    checkInProgress: false,
  },
  isCheckingPermissions: false,
  permissionStatus: {
    hasDrive: false,
    hasSheets: false,
    hasCalendar: false,
    allRequired: false,
    folderStructureExists: false,
    checked: false,
    lastChecked: null,
    checkInProgress: false,
  },
};

// 🏭 CONTEXT CREATION
// ════════════════════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// 🔄 REDUCER FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_AUTH_STATE":
      return { ...state, ...action.payload };

    case "SET_VALIDATION_STATUS":
      return {
        ...state,
        validationStatus: { ...state.validationStatus, ...action.payload },
      };

    case "SET_PERMISSIONS":
      return {
        ...state,
        permissions: { ...state.permissions, ...action.payload },
        permissionStatus: { ...state.permissions, ...action.payload },
      };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "RESET_STATE":
      return { ...initialState, loading: false };

    default:
      return state;
  }
}

// 🏗️ PROVIDER COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: React.ReactNode;
  config?: {
    requiredScopes?: string[];
    autoValidate?: boolean;
    validationDelay?: number;
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config = {
    requiredScopes: [],
    autoValidate: true,
    validationDelay: 3000,
  },
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authManager = ChromeAuthManager.getInstance();

  // 🔧 STATE UPDATE FUNCTIONS
  // ────────────────────────────────────────────────────────────────────────────

  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    dispatch({ type: "SET_AUTH_STATE", payload: updates });
  }, []);

  const updateValidationStatus = useCallback(
    (updates: Partial<ValidationStatus>) => {
      dispatch({ type: "SET_VALIDATION_STATUS", payload: updates });
    },
    []
  );

  const setPermissions = useCallback(
    (permissions: Partial<PermissionStatus>) => {
      dispatch({ type: "SET_PERMISSIONS", payload: permissions });
    },
    []
  );

  const setIsCheckingPermissions = useCallback((checking: boolean) => {
    dispatch({
      type: "SET_AUTH_STATE",
      payload: { isCheckingPermissions: checking },
    });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  // 🎯 HOOK INTEGRATION - Sửa lỗi type compatibility
  // ────────────────────────────────────────────────────────────────────────────

  // Convert AuthState to CoreAuthState for useAuthValidation hook
  const coreAuthState: any = {
    ...state,
    validationStatus: {
      ...state.validationStatus,
      // Đảm bảo các thuộc tính cần thiết tồn tại
      isExpired: state.validationStatus.isExpired ?? false,
      grantedScopes: state.validationStatus.grantedScopes ?? [],
    },
  };

  const validationHook = useAuthValidation({
    authState: coreAuthState,
    authManager,
    permissions: state.permissions,
    setPermissions,
    setIsCheckingPermissions,
    updateAuthState: (updates: any) => {
      // Convert CoreAuthState updates to AuthState updates
      const convertedUpdates: Partial<AuthState> = { ...updates };
      updateAuthState(convertedUpdates);
    },
    updateValidationStatus: (updates: any) => {
      updateValidationStatus(updates);
    },
  });

  const tokenHook = useTokenManagement({
    authState: coreAuthState,
    authManager,
    updateAuthState: (updates: any) => {
      const convertedUpdates: Partial<AuthState> = { ...updates };
      updateAuthState(convertedUpdates);
    },
    updateValidationStatus: (updates: any) => {
      updateValidationStatus(updates);
    },
  });

  // 🔐 AUTH OPERATIONS (giữ nguyên)
  // ────────────────────────────────────────────────────────────────────────────

  const login = useCallback(async (): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      setError(null);

      const success = await authManager.login();
      if (!success) {
        throw new Error("Login failed");
      }

      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error("No user data after login");
      }

      updateAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });

      // 🔄 Schedule validation
      if (config.autoValidate) {
        setTimeout(() => {
          validationHook.validateAuthentication(true);
        }, config.validationDelay);
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
      setLoading(false);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [
    authManager,
    config.autoValidate,
    config.validationDelay,
    setError,
    setLoading,
    updateAuthState,
    validationHook,
  ]);

  const logout = useCallback(async (): Promise<AuthOperationResult> => {
    try {
      setLoading(true);

      await authManager.logout();
      dispatch({ type: "RESET_STATE" });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      setError(errorMessage);
      setLoading(false);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [authManager, setError, setLoading]);

  const forceReauth = useCallback(async (): Promise<AuthOperationResult> => {
    try {
      setLoading(true);
      setError(null);

      const success = await authManager.forceReauth();
      if (!success) {
        throw new Error("Reauth failed");
      }

      const user = authManager.getCurrentUser();
      updateAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });

      // 🔄 Re-validate after reauth
      if (config.autoValidate) {
        setTimeout(() => {
          validationHook.validateAuthentication(true);
        }, config.validationDelay);
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Reauth failed";
      setError(errorMessage);
      setLoading(false);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [
    authManager,
    config.autoValidate,
    config.validationDelay,
    setError,
    setLoading,
    updateAuthState,
    validationHook,
  ]);

  // 📊 STATUS GETTERS (giữ nguyên)
  // ────────────────────────────────────────────────────────────────────────────

  const getAuthStatus = useCallback((): AuthStatus => {
    return {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      loading: state.loading,
      error: state.error,
      isReady: state.isReady,
      isValidating: state.isValidating,
      lastValidation: state.lastValidation,
      hasToken: !!state.user?.accessToken,
      tokenValid: state.validationStatus.hasValidToken,
      tokenExpired:
        state.validationStatus.isValid === false &&
        state.validationStatus.hasValidToken === false,
      tokenExpiry: state.validationStatus.expiresAt,
      hasRequiredScopes: state.validationStatus.hasRequiredScopes,
      hasDriveAccess: state.permissions.hasDrive,
      hasSheetsAccess: state.permissions.hasSheets,
      hasCalendarAccess: state.permissions.hasCalendar,
      grantedScopes: state.validationStatus.grantedScopes || [],
      validationErrors: state.validationStatus.errors,
      scopeDetails: [],
    };
  }, [state]);

  const diagnoseAuthIssues = useCallback((): AuthDiagnosticResult => {
    const issues = [];
    const recommendations = [];

    if (!state.isAuthenticated) {
      issues.push({
        type: "no_auth",
        message: "User not authenticated",
        severity: "critical",
        canAutoRecover: false,
        requiresUserAction: true,
        suggestedAction: "Please sign in with your Google account",
      });
      recommendations.push("User needs to sign in with Google");
    }

    if (state.validationStatus.needsReauth) {
      issues.push({
        type: "invalid_token",
        message: "Re-authentication required",
        severity: "critical",
        canAutoRecover: true,
        requiresUserAction: true,
        suggestedAction: "Please sign in again",
      });
      recommendations.push("Re-authentication required");
    }

    if (!state.validationStatus.hasRequiredScopes) {
      issues.push({
        type: "insufficient_scope",
        message: "Missing required permissions",
        severity: "critical",
        canAutoRecover: true,
        requiresUserAction: true,
        suggestedAction: "Grant additional permissions",
      });
      recommendations.push(
        "Grant required permissions during re-authentication"
      );
    }

    return {
      isHealthy: issues.length === 0,
      severity: issues.some((i) => i.severity === "critical")
        ? "critical"
        : "healthy",
      issues,
      recommendations,
      needsUserAction: issues.some((i) => i.requiresUserAction),
      canAutoRecover: issues.some((i) => i.canAutoRecover),
      systemStatus: {
        tokenValid: state.validationStatus.hasValidToken,
        scopesValid: state.validationStatus.hasRequiredScopes,
        networkReachable: true,
        authManagerHealthy: true,
        chromeIdentityAvailable: true,
        manifestConfigValid: true,
        cacheOperational: true,
      },
    };
  }, [state]);

  // 🎯 COMPUTED VALUES (giữ nguyên)
  // ────────────────────────────────────────────────────────────────────────────

  const isReady = state.isReady;
  const isAuthenticated = state.isAuthenticated;
  const isLoading = state.loading || state.isValidating;
  const hasError = !!state.error;
  const hasDriveAccess = state.permissions.hasDrive;
  const hasSheetsAccess = state.permissions.hasSheets;
  const hasCalendarAccess = state.permissions.hasCalendar;

  // 🔄 INITIALIZATION EFFECT (giữ nguyên)
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        await authManager.initialize();

        const isAuthenticated = authManager.isAuthenticated;
        const user = authManager.getCurrentUser();

        updateAuthState({
          isAuthenticated,
          user,
          loading: false,
          error: null,
        });

        if (isAuthenticated && config.autoValidate) {
          setTimeout(() => {
            validationHook.validateAuthentication(true);
          }, config.validationDelay);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Initialization failed"
        );
        setLoading(false);
      }
    };

    initializeAuth();
  }, [
    authManager,
    config.autoValidate,
    config.validationDelay,
    setError,
    setLoading,
    updateAuthState,
    validationHook,
  ]);

  // 🎯 CONTEXT VALUE (giữ nguyên)
  // ────────────────────────────────────────────────────────────────────────────

  const contextValue: AuthContextValue = {
    // Core state
    authState: state,
    validationStatus: state.validationStatus,
    permissions: state.permissions,

    // Loading states
    isCheckingPermissions: state.isCheckingPermissions,

    // Actions
    login,
    logout,
    forceReauth,

    // Validation
    validateAuth: validationHook.validateAuthentication,
    triggerValidation: validationHook.triggerValidation,
    refreshPermissions: validationHook.refreshPermissions,

    // Token management
    refreshAccessToken: tokenHook.refreshAccessToken,
    forceTokenRefresh: tokenHook.forceTokenRefresh,

    // Status getters
    getAuthStatus,
    diagnoseAuthIssues,

    // Utility functions
    checkScope: (scope: string) => authManager.hasScope(scope),
    getRequiredScopes: () => config.requiredScopes || [],

    // Computed values
    isReady,
    isAuthenticated,
    isLoading,
    hasError,

    // Permission shortcuts
    hasDriveAccess,
    hasSheetsAccess,
    hasCalendarAccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// 🎯 HOOK FOR USING AUTH CONTEXT
// ════════════════════════════════════════════════════════════════════════════════

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
