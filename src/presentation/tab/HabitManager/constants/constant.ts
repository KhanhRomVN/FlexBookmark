export const APP_CONFIG = {
    NAME: 'HabitTracker',
    SHEET_NAME: 'Daily Habits Tracker',
    FOLDER_NAME: 'HabitTracker'
} as const;

export const HABIT_TYPES = {
    GOOD: 'good',
    BAD: 'bad'
} as const;

export type HabitType = 'good' | 'bad';

export const DIFFICULTY_LEVELS = {
    VERY_EASY: 1,
    EASY: 2,
    MEDIUM: 3,
    HARD: 4,
    VERY_HARD: 5
} as const;

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export const HABIT_CATEGORIES = {
    HEALTH: 'health',
    FITNESS: 'fitness',
    PRODUCTIVITY: 'productivity',
    MINDFULNESS: 'mindfulness',
    LEARNING: 'learning',
    SOCIAL: 'social',
    FINANCE: 'finance',
    CREATIVITY: 'creativity',
    OTHER: 'other'
} as const;

export type HabitCategory = 'health' | 'fitness' | 'productivity' | 'mindfulness' | 'learning' | 'social' | 'finance' | 'creativity' | 'other';

export const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];