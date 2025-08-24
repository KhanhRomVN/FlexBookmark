// src/presentation/types/nodeTypes.ts
import type { Task, Status } from "./task";

// Data interface for CollectionNode
export interface CollectionNodeData {
    collection: string;
    tasks: Task[];
    onClick: (task: Task) => void;
}

// Data interface for TaskNode
export interface TaskNodeData {
    id: string;
    title: string;
    status: Status;
    collection?: string;
    priority: string;
    dueDate?: Date | null;
    dueTime?: Date | null;
    subtasks?: any[];
    attachments?: any[];
    onClick: () => void;
    [key: string]: any; // Allow additional task properties
}