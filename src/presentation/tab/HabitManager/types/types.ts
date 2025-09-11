export interface HabitSubtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Habit {
    id: string;
    name: string;
    description: string;
    habitType: 'good' | 'bad';
    difficultyLevel: number;
    goal?: number;
    limit?: number;
    colorCode: string;
    category: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    currentStreak: number;
    longestStreak: number;
    completedToday: boolean;
    startTime?: string;
    unit?: string;
    tags: string[];
    subtasks?: HabitSubtask[];
    dailyCounts: (number | string | null)[];
    emoji?: string;
}

export interface HabitFormData {
    name: string;
    description: string;
    habitType: 'good' | 'bad';
    difficultyLevel: number;
    goal?: number;
    limit?: number;
    colorCode: string;
    category: string;
    startTime?: string;
    unit?: string;
    tags?: string[];
    subtasks?: HabitSubtask[];
    emoji?: string;
}

export type HabitType = 'good' | 'bad';
export type HabitCategory = 'health' | 'fitness' | 'productivity' | 'mindfulness' | 'learning' | 'social' | 'finance' | 'creativity' | 'other';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;