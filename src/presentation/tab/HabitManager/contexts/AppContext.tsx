// src/presentation/tab/HabitManager/contexts/AppContext.tsx

/**
 * 🎯 MAIN APPLICATION CONTEXT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 📋 TỔNG QUAN:
 * ├── 🎯 Root context combining auth and habit contexts
 * ├── 🔄 Global state management và coordination
 * ├── 📊 Application-wide settings và preferences
 * ├── 🌐 Network status và connectivity monitoring
 * └── 🛠️ Utility functions for cross-context operations
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { AuthProvider, useAuthContext } from "./AuthContext";
import { HabitProvider, useHabitContext } from "./HabitContext";

// 📚 INTERFACES & TYPES
// ════════════════════════════════════════════════════════════════════════════════

interface AppSettings {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: {
    dailyReminder: boolean;
    weeklySummary: boolean;
    streakNotifications: boolean;
  };
  syncFrequency: number; // minutes
  offlineMode: boolean;
}

interface AppState {
  isOnline: boolean;
  isInitialized: boolean;
  settings: AppSettings;
  lastSync: number | null;
  errors: string[];
}

interface AppContextValue {
  // 📊 State
  isOnline: boolean;
  isInitialized: boolean;
  settings: AppSettings;
  lastSync: number | null;
  errors: string[];

  // 🎯 Operations
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearError: (index: number) => void;
  clearAllErrors: () => void;
  forceSync: () => Promise<void>;

  // 🔧 Utilities
  addError: (error: string) => void;
}

type AppAction =
  | { type: "SET_ONLINE"; payload: boolean }
  | { type: "SET_INITIALIZED"; payload: boolean }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "SET_LAST_SYNC"; payload: number | null }
  | { type: "ADD_ERROR"; payload: string }
  | { type: "CLEAR_ERROR"; payload: number }
  | { type: "CLEAR_ALL_ERRORS" };

// 🎯 INITIAL STATE
// ════════════════════════════════════════════════════════════════════════════════

const initialSettings: AppSettings = {
  theme: "auto",
  language: navigator.language,
  notifications: {
    dailyReminder: true,
    weeklySummary: true,
    streakNotifications: true,
  },
  syncFrequency: 30, // 30 minutes
  offlineMode: false,
};

const initialState: AppState = {
  isOnline: navigator.onLine,
  isInitialized: false,
  settings: initialSettings,
  lastSync: null,
  errors: [],
};

// 🏭 CONTEXT CREATION
// ════════════════════════════════════════════════════════════════════════════════

const AppContext = createContext<AppContextValue | undefined>(undefined);

// 🔄 REDUCER FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ONLINE":
      return { ...state, isOnline: action.payload };

    case "SET_INITIALIZED":
      return { ...state, isInitialized: action.payload };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case "SET_LAST_SYNC":
      return { ...state, lastSync: action.payload };

    case "ADD_ERROR":
      return {
        ...state,
        errors: [...state.errors, action.payload].slice(-10), // Keep last 10 errors
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        errors: state.errors.filter((_, index) => index !== action.payload),
      };

    case "CLEAR_ALL_ERRORS":
      return { ...state, errors: [] };

    default:
      return state;
  }
}

// 🏗️ PROVIDER COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const authContext = useAuthContext();
  const habitContext = useHabitContext();

  // 🔧 DISPATCH HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  const setIsOnline = useCallback((online: boolean) => {
    dispatch({ type: "SET_ONLINE", payload: online });
  }, []);

  const setInitialized = useCallback((initialized: boolean) => {
    dispatch({ type: "SET_INITIALIZED", payload: initialized });
  }, []);

  const setLastSync = useCallback((timestamp: number | null) => {
    dispatch({ type: "SET_LAST_SYNC", payload: timestamp });
  }, []);

  const addError = useCallback((error: string) => {
    dispatch({ type: "ADD_ERROR", payload: error });
  }, []);

  const clearError = useCallback((index: number) => {
    dispatch({ type: "CLEAR_ERROR", payload: index });
  }, []);

  const clearAllErrors = useCallback(() => {
    dispatch({ type: "CLEAR_ALL_ERRORS" });
  }, []);

  // 🎯 OPERATIONS
  // ────────────────────────────────────────────────────────────────────────────

  const updateSettings = useCallback(
    (settings: Partial<AppSettings>) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: settings });

      // Save to localStorage
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({
          appSettings: { ...state.settings, ...settings },
        });
      }
    },
    [state.settings]
  );

  const forceSync = useCallback(async () => {
    try {
      await habitContext.syncHabits(true);
      setLastSync(Date.now());
    } catch (error) {
      addError(error instanceof Error ? error.message : "Force sync failed");
    }
  }, [habitContext, setLastSync, addError]);

  // 🌐 NETWORK MONITORING
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);

  // 📱 LOAD SETTINGS FROM STORAGE
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadSettings = async () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        try {
          const result = await chrome.storage.local.get("appSettings");
          if (result.appSettings) {
            dispatch({ type: "UPDATE_SETTINGS", payload: result.appSettings });
          }
        } catch (error) {
          console.warn("Failed to load settings from storage:", error);
        }
      }

      setInitialized(true);
    };

    loadSettings();
  }, [setInitialized]);

  // 🔄 PERIODIC SYNC
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (
      !state.isOnline ||
      !authContext.isAuthenticated ||
      !habitContext.initialized
    ) {
      return;
    }

    const syncInterval = setInterval(() => {
      forceSync();
    }, state.settings.syncFrequency * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [
    state.isOnline,
    state.settings.syncFrequency,
    authContext.isAuthenticated,
    habitContext.initialized,
    forceSync,
  ]);

  // 🎯 CONTEXT VALUE
  // ────────────────────────────────────────────────────────────────────────────

  const contextValue: AppContextValue = {
    // 📊 State
    isOnline: state.isOnline,
    isInitialized: state.isInitialized,
    settings: state.settings,
    lastSync: state.lastSync,
    errors: state.errors,

    // 🎯 Operations
    updateSettings,
    clearError,
    clearAllErrors,
    forceSync,

    // 🔧 Utilities
    addError,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// 🎯 HOOK FOR USING APP CONTEXT
// ════════════════════════════════════════════════════════════════════════════════

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// 🏗️ ROOT PROVIDER COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

interface RootProviderProps {
  children: React.ReactNode;
}

export const RootProvider: React.FC<RootProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <HabitProvider>
        <AppProvider>{children}</AppProvider>
      </HabitProvider>
    </AuthProvider>
  );
};

export default AppContext;
