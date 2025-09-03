// src/presentation/tab/HabitManager/contexts/HabitContext.tsx

/**
 * 📊 HABIT DATA CONTEXT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 📋 TỔNG QUAN:
 * ├── 🎯 React Context cho habit data management
 * ├── 🔄 Centralized habit state và operations
 * ├── 📊 Provider component với comprehensive data management
 * ├── 💾 Cache integration và synchronization
 * └── 🛠️ Utility functions và error handling
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { useHabitCache } from "../hooks/cache/useHabitCache";
import { useHabit } from "../hooks/habit/useHabit";
import { useAuthContext } from "./AuthContext";
import type { Habit, HabitFormData } from "../types";
import {
  HabitContextValue,
  HabitOperationResult,
  BatchOperationResult,
  SyncResult,
} from "./types";

// 📚 INTERFACES & TYPES
// ════════════════════════════════════════════════════════════════════════════════

interface HabitState {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  syncInProgress: boolean;
  initialized: boolean;
  currentSheetId: string | null;
}

type HabitAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_HABITS"; payload: Habit[] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SYNC_PROGRESS"; payload: boolean }
  | { type: "SET_INITIALIZED"; payload: boolean }
  | { type: "SET_SHEET_ID"; payload: string | null }
  | { type: "ADD_HABIT"; payload: Habit }
  | { type: "UPDATE_HABIT"; payload: Habit }
  | { type: "DELETE_HABIT"; payload: string }
  | { type: "RESET_STATE" };

// 🎯 INITIAL STATE
// ════════════════════════════════════════════════════════════════════════════════

const initialState: HabitState = {
  habits: [],
  loading: false,
  error: null,
  syncInProgress: false,
  initialized: false,
  currentSheetId: null,
};

// 🏭 CONTEXT CREATION
// ════════════════════════════════════════════════════════════════════════════════

const HabitContext = createContext<HabitContextValue | undefined>(undefined);

// 🔄 REDUCER FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_HABITS":
      return { ...state, habits: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_SYNC_PROGRESS":
      return { ...state, syncInProgress: action.payload };

    case "SET_INITIALIZED":
      return { ...state, initialized: action.payload };

    case "SET_SHEET_ID":
      return { ...state, currentSheetId: action.payload };

    case "ADD_HABIT":
      return { ...state, habits: [...state.habits, action.payload] };

    case "UPDATE_HABIT":
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };

    case "DELETE_HABIT":
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.payload),
      };

    case "RESET_STATE":
      return { ...initialState };

    default:
      return state;
  }
}

// 🏗️ PROVIDER COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

interface HabitProviderProps {
  children: React.ReactNode;
}

export const HabitProvider: React.FC<HabitProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(habitReducer, initialState);
  const { authState } = useAuthContext();
  const habitCache = useHabitCache();

  // 🔧 STATE UPDATE FUNCTIONS
  // ────────────────────────────────────────────────────────────────────────────

  const setHabits = useCallback(
    (habits: Habit[] | ((prev: Habit[]) => Habit[])) => {
      if (typeof habits === "function") {
        dispatch({ type: "SET_HABITS", payload: habits(state.habits) });
      } else {
        dispatch({ type: "SET_HABITS", payload: habits });
      }
    },
    [state.habits]
  );

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const setSyncInProgress = useCallback((inProgress: boolean) => {
    dispatch({ type: "SET_SYNC_PROGRESS", payload: inProgress });
  }, []);

  const setInitialized = useCallback((initialized: boolean) => {
    dispatch({ type: "SET_INITIALIZED", payload: initialized });
  }, []);

  const setCurrentSheetId = useCallback((sheetId: string | null) => {
    dispatch({ type: "SET_SHEET_ID", payload: sheetId });
  }, []);

  // 🎯 HOOK INTEGRATION
  // ────────────────────────────────────────────────────────────────────────────

  const habitHook = useHabit({
    getAuthStatus: () => ({
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      hasToken: !!authState.user?.accessToken,
    }),
  });

  // 🔄 SYNC OPERATIONS
  // ────────────────────────────────────────────────────────────────────────────

  const syncHabits = useCallback(
    async (forceRefresh: boolean = false): Promise<SyncResult> => {
      try {
        setSyncInProgress(true);
        setError(null);

        const result = await habitHook.syncHabits(forceRefresh);

        if (result.success && result.habits) {
          // Update local state with synced habits
          setHabits(result.habits);

          // Cache the habits
          await habitCache.storeHabits(result.habits);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Sync failed";
        setError(errorMessage);
        return {
          success: false,
          habitsCount: state.habits.length,
          lastSync: Date.now(),
          changes: { added: 0, updated: 0, deleted: 0 },
          error: errorMessage,
          needsAuth: true,
        };
      } finally {
        setSyncInProgress(false);
      }
    },
    [
      habitHook,
      habitCache,
      setSyncInProgress,
      setError,
      setHabits,
      state.habits.length,
    ]
  );

  // 🎯 HABIT OPERATIONS
  // ────────────────────────────────────────────────────────────────────────────

  const createHabit = useCallback(
    async (formData: HabitFormData): Promise<HabitOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await habitHook.createHabit(formData);

        if (result.success && result.data) {
          // Update local state
          dispatch({ type: "ADD_HABIT", payload: result.data });

          // Cache the new habit
          await habitCache.storeHabit(result.data);

          return { success: true, data: result.data };
        }

        return {
          success: false,
          error: result.error || "Failed to create habit",
          needsAuth: result.needsAuth,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Create habit failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          needsAuth: true,
        };
      } finally {
        setLoading(false);
      }
    },
    [habitHook, habitCache, setLoading, setError]
  );

  const updateHabit = useCallback(
    async (habit: Habit): Promise<HabitOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await habitHook.updateHabit(habit);

        if (result.success && result.data) {
          // Update local state
          dispatch({ type: "UPDATE_HABIT", payload: result.data });

          // Cache the updated habit
          await habitCache.updateHabit(result.data);

          return { success: true, data: result.data };
        }

        return {
          success: false,
          error: result.error || "Failed to update habit",
          needsAuth: result.needsAuth,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Update habit failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          needsAuth: true,
        };
      } finally {
        setLoading(false);
      }
    },
    [habitHook, habitCache, setLoading, setError]
  );

  const deleteHabit = useCallback(
    async (habitId: string): Promise<HabitOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await habitHook.deleteHabit(habitId);

        if (result.success) {
          // Update local state
          dispatch({ type: "DELETE_HABIT", payload: habitId });

          // Remove from cache
          await habitCache.removeHabit(habitId);

          return { success: true };
        }

        return {
          success: false,
          error: result.error || "Failed to delete habit",
          needsAuth: result.needsAuth,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Delete habit failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          needsAuth: true,
        };
      } finally {
        setLoading(false);
      }
    },
    [habitHook, habitCache, setLoading, setError]
  );

  const archiveHabit = useCallback(
    async (
      habitId: string,
      archive: boolean
    ): Promise<HabitOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await habitHook.archiveHabit(habitId, archive);

        if (result.success && result.data) {
          // Update local state
          dispatch({ type: "UPDATE_HABIT", payload: result.data });

          // Cache the updated habit
          await habitCache.updateHabit(result.data);

          return { success: true, data: result.data };
        }

        return {
          success: false,
          error: result.error || "Failed to archive habit",
          needsAuth: result.needsAuth,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Archive habit failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          needsAuth: true,
        };
      } finally {
        setLoading(false);
      }
    },
    [habitHook, habitCache, setLoading, setError]
  );

  const updateDailyHabit = useCallback(
    async (
      habitId: string,
      day: number,
      value: number
    ): Promise<HabitOperationResult> => {
      try {
        setError(null);

        const result = await habitHook.updateDailyHabit(habitId, day, value);

        if (result.success && result.data) {
          // Update local state
          dispatch({ type: "UPDATE_HABIT", payload: result.data });

          // Cache the updated habit
          await habitCache.updateHabit(result.data);

          return { success: true, data: result.data };
        }

        return {
          success: false,
          error: result.error || "Failed to update daily habit",
          needsAuth: result.needsAuth,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Update daily habit failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          needsAuth: true,
        };
      }
    },
    [habitHook, habitCache, setError]
  );

  const batchArchiveHabits = useCallback(
    async (
      habitIds: string[],
      archive: boolean
    ): Promise<BatchOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await habitHook.batchArchiveHabits(habitIds, archive);

        // Convert từ HabitBatchOperationResult sang BatchOperationResult
        const convertedResult: BatchOperationResult = {
          successful: result.successful,
          failed: result.failed,
          errors: result.errors,
          needsAuth: result.needsAuth,
        };

        if (result.successful > 0) {
          // Refresh the habits list to get updated data
          await syncHabits(true);
        }

        return convertedResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Batch archive failed";
        setError(errorMessage);

        // Trả về error dạng object array thay vì string array
        return {
          successful: 0,
          failed: habitIds.length,
          errors: [{ habitId: "batch", error: errorMessage }],
          needsAuth: true,
        };
      } finally {
        setLoading(false);
      }
    },
    [habitHook, syncHabits, setLoading, setError]
  );

  const batchDeleteHabits = useCallback(
    async (habitIds: string[]): Promise<BatchOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await habitHook.batchDeleteHabits(habitIds);

        // Convert từ HabitBatchOperationResult sang BatchOperationResult
        const convertedResult: BatchOperationResult = {
          successful: result.successful,
          failed: result.failed,
          errors: result.errors,
          needsAuth: result.needsAuth,
        };

        if (result.successful > 0) {
          // Update local state by removing deleted habits
          setHabits((prev) => prev.filter((h) => !habitIds.includes(h.id)));

          // Remove from cache
          await habitCache.removeHabits(habitIds);
        }

        return convertedResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Batch delete failed";
        setError(errorMessage);

        // Trả về error dạng object array thay vì string array
        return {
          successful: 0,
          failed: habitIds.length,
          errors: [{ habitId: "batch", error: errorMessage }],
          needsAuth: true,
        };
      } finally {
        setLoading(false);
      }
    },
    [habitHook, habitCache, setLoading, setError, setHabits]
  );

  // 🔄 INITIALIZATION EFFECT
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const initializeHabitData = async () => {
      if (!authState.isReady || state.initialized) {
        return;
      }

      try {
        setLoading(true);

        // Try to load from cache first
        const cachedHabits = await habitCache.getAllHabits();
        if (cachedHabits.length > 0) {
          setHabits(cachedHabits);
          console.log(`📦 Loaded ${cachedHabits.length} habits from cache`);
        }

        // Setup drive structure
        const setupResult = await habitHook.setupDriveStructure();
        if (setupResult.success && setupResult.sheetId) {
          setCurrentSheetId(setupResult.sheetId);
        }

        // Sync with remote data
        await syncHabits(true);

        setInitialized(true);
      } catch (error) {
        console.error("❌ Failed to initialize habit data:", error);
        setError("Failed to initialize habit data");
      } finally {
        setLoading(false);
      }
    };

    initializeHabitData();
  }, [
    authState.isReady,
    state.initialized,
    habitCache,
    habitHook,
    syncHabits,
    setLoading,
    setError,
    setHabits,
    setCurrentSheetId,
    setInitialized,
  ]);

  // 🎯 COMPUTED VALUES
  // ────────────────────────────────────────────────────────────────────────────

  const isReady = state.initialized && !state.loading && !state.syncInProgress;
  const habitCount = state.habits.length;
  const activeHabits = state.habits.filter((h) => !h.isArchived);
  const archivedHabits = state.habits.filter((h) => h.isArchived);

  // 🎯 CONTEXT VALUE
  // ────────────────────────────────────────────────────────────────────────────

  const contextValue: HabitContextValue = {
    // 📊 State
    habits: state.habits,
    loading: state.loading,
    error: state.error,
    syncInProgress: state.syncInProgress,
    initialized: state.initialized,
    currentSheetId: state.currentSheetId,

    // 🎯 Operations
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    updateDailyHabit,
    syncHabits,
    batchArchiveHabits,
    batchDeleteHabits,

    // 🔧 Utilities
    setError,
    setLoading,
    setHabits,

    // 📈 Computed values
    isReady,
    habitCount,
    activeHabits,
    archivedHabits,
  };

  return (
    <HabitContext.Provider value={contextValue}>
      {children}
    </HabitContext.Provider>
  );
};

// 🎯 HOOK FOR USING HABIT CONTEXT
// ════════════════════════════════════════════════════════════════════════════════

export const useHabitContext = (): HabitContextValue => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error("useHabitContext must be used within a HabitProvider");
  }
  return context;
};

export default HabitContext;
