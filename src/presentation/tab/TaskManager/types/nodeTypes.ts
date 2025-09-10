// src/presentation/types/nodeTypes.ts
import type { Task, Status } from "./task";

// Data interface for CollectionNode - extends Record<string, unknown> for React Flow compatibility
export interface CollectionNodeData extends Record<string, unknown> {
    collection: string;
    tasks: Task[];
    onClick: (task: Task) => void;
}

// Data interface for TaskNode - extends Record<string, unknown> for React Flow compatibility
export interface TaskNodeData extends Record<string, unknown> {
    id: string;
    title: string;
    status: Status;
    collection?: string;
    priority: string;
    dueDate?: Date | null;
    dueTime?: Date | null;
    subtasks?: Array<{
        id?: string;
        title: string;
        completed: boolean;
        linkedTaskId?: string;
        [key: string]: any;
    }>;
    attachments?: any[];
    onClick: () => void;
    // Include all other Task properties
    description?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    assignedTo?: string;
    estimatedTime?: number;
    actualTime?: number;
}