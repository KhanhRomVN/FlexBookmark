// src/presentation/tab/HabitManager/contexts/index.ts

/**
 * 📦 CONTEXTS BARREL EXPORT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 📋 TỔNG QUAN:
 * ├── 🎯 Central export for all context-related functionality
 * ├── 🔄 Simplified imports for components
 * ├── 📊 Type re-exports for convenience
 * └── 🛠️ Utility exports for context usage
 */

export { AuthProvider, useAuthContext } from './AuthContext';
export { HabitProvider, useHabitContext } from './HabitContext';
export { AppProvider, useAppContext, RootProvider } from './AppContext';
export type { AuthContextValue } from './types';
export type { HabitContextValue } from './types';
export type { AppContextValue } from './types';