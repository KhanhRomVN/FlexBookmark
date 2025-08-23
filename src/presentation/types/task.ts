// src/presentation/types/task.ts
import { ReactNode } from "react";

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "backlog" | "todo" | "in-progress" | "done" | "archive" | "overdue";

export interface Subtask {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    linkedTaskId?: string;
    requiredCompleted?: boolean;
}

export interface Attachment {
    id: string;
    title: string;
    url: string;
    type: "image" | "video" | "audio" | "file" | "other";
}

export interface ActivityLog {
    details: ReactNode;
    id: string;
    action: string;
    userId: string;
    timestamp: Date;
    comment?: string;
}

export interface Task {
    updatedAt: string | number | Date;
    createdAt: string | number | Date;
    id: string;
    title: string;
    description?: string;
    status: Status;
    priority: Priority;
    collection?: string; // Collection field

    // Location fields - stored as strings in metadata
    locationName?: string;      // Custom location name
    locationAddress?: string;   // Address from map service
    locationCoordinates?: string; // Coordinates as "lat,lng" string

    startTime?: Date | null;
    startDate?: Date | null;

    dueTime?: Date | null;
    dueDate?: Date | null;

    actualStartDate?: Date | null;
    actualStartTime?: Date | null;
    actualEndDate?: Date | null;
    actualEndTime?: Date | null;
    completed: boolean;
    subtasks?: Subtask[];
    attachments?: Attachment[];
    tags?: string[];
    activityLog?: ActivityLog[];
}