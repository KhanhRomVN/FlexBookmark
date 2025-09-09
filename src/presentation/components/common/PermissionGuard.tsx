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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (authState.isAuthenticated) {
      checkPermissionStatus();
    }
  }, [authState.isAuthenticated]);

  const checkPermissionStatus = async () => {
    setChecking(true);
    try {
      const permissions = await checkPermissions();
      setDebugInfo(permissions);
      console.log("Current permissions:", permissions);
    } catch (error) {
      console.error("Permission check failed:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleReauth = async () => {
    setChecking(true);
    try {
      // Clear Chrome's OAuth cache completely
      if (chrome?.identity) {
        await new Promise<void>((resolve) => {
          chrome.identity.clearAllCachedAuthTokens(() => {
            console.log("Cleared all cached tokens");
            resolve();
          });
        });
      }

      // Force new login with interactive mode
      await login();
      await checkPermissionStatus();
    } catch (error) {
      console.error("Reauthentication failed:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleForceFullReauth = async () => {
    setChecking(true);
    try {
      // More aggressive token clearing
      if (chrome?.identity) {
        // Clear all tokens
        await new Promise<void>((resolve) => {
          chrome.identity.clearAllCachedAuthTokens(resolve);
        });

        // Clear any stored auth state
        await chrome.storage.local.clear();

        console.log("Cleared all auth data, forcing full reauth...");
      }

      // Wait a bit then login
      setTimeout(async () => {
        await login();
        await checkPermissionStatus();
        setChecking(false);
      }, 1000);
    } catch (error) {
      console.error("Force reauth failed:", error);
      setChecking(false);
    }
  };

  // Loading state with full screen
  if (authState.loading || checking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="flex flex-col items-center space-y-4">
          {/* Modern spinner */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200/30 border-t-blue-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-l-blue-600 rounded-full animate-spin animate-reverse"></div>
          </div>

          <div className="text-center">
            <p className="text-blue-100 text-sm font-medium">
              {authState.loading
                ? "Initializing..."
                : "Verifying permissions..."}
            </p>
            <p className="text-blue-200/60 text-xs mt-1">
              Please wait a moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication required state with full screen
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="w-full max-w-md">
          {/* Glassmorphism card */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Logo/Icon section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                FlexBookmark
              </h1>
              <p className="text-blue-200/80 text-sm">
                Advanced bookmark management
              </p>
            </div>

            {/* Authentication section */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">
                Authentication Required
              </h2>
              <p className="text-blue-100/80 text-sm leading-relaxed">
                Connect with Google to access all your bookmarks, tasks,
                calendar and productivity features.
              </p>

              {/* Required permissions list */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                <p className="text-blue-200 text-xs font-medium mb-3">
                  Required Permissions:
                </p>
                <div className="space-y-2 text-xs text-blue-100/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Google Calendar - Manage events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Google Tasks - Task management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Google Drive - File storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Google Sheets - Data sync</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error message if any */}
            {authState.error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-red-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-200 text-sm">{authState.error}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleReauth}
                disabled={checking}
                className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center space-x-3 group"
              >
                {checking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 text-red-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                    <svg
                      className="w-4 h-4 text-gray-500 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Force full reauth button */}
              <button
                onClick={handleForceFullReauth}
                disabled={checking}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
              >
                {checking ? "Processing..." : "Force Full Re-authentication"}
              </button>

              {/* Debug toggle */}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="w-full text-blue-200/60 hover:text-blue-200 text-xs py-2 transition-colors"
              >
                {showDebug ? "Hide Debug Info" : "Show Debug Info"}
              </button>
            </div>

            {/* Debug information */}
            {showDebug && debugInfo && (
              <div className="mt-4 p-3 bg-black/20 rounded-lg">
                <p className="text-blue-200 text-xs font-medium mb-2">
                  Debug Info:
                </p>
                <pre className="text-xs text-blue-100/80 whitespace-pre-wrap break-all">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}

            {/* Security note */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-blue-200/60 text-center leading-relaxed">
                Your data is encrypted and secure. We only access the
                permissions you grant to enhance your productivity experience.
              </p>
            </div>
          </div>

          {/* Features preview */}
          <div className="mt-8 text-center">
            <p className="text-blue-200/60 text-xs mb-4">
              What you'll get access to:
            </p>
            <div className="flex justify-center space-x-6 text-blue-200/80">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </div>
                <span className="text-xs">Bookmarks</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <span className="text-xs">Tasks</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z"
                    />
                  </svg>
                </div>
                <span className="text-xs">Calendar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
