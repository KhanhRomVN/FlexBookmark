import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface PermissionGuardProps {
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
}) => {
  const { authState, login, checkPermissions } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (authState.isAuthenticated) {
      checkPermissionStatus();
    }
  }, [authState.isAuthenticated]);

  const checkPermissionStatus = async () => {
    setChecking(true);
    try {
      await checkPermissions();
    } catch (error) {
      console.error("Permission check failed:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleReauth = async () => {
    setChecking(true);
    try {
      await login(); // This now always requests all scopes
      await checkPermissionStatus();
    } catch (error) {
      console.error("Reauthentication failed:", error);
    } finally {
      setChecking(false);
    }
  };

  if (authState.loading || checking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-600">
          Checking permissions...
        </span>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please authenticate with Google to use all features of FlexBookmark.
          </p>

          <button
            onClick={handleReauth}
            disabled={checking}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {checking ? "Authenticating..." : "Authenticate with Google"}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            You'll be redirected to Google to grant necessary permissions
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
