import { ReactNode } from "react";

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "backlog" | "todo" | "in-progress" | "done" | "archive";

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
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
    id: string;
    title: string;
    description?: string;
    status: Status;
    priority: Priority;
    startTime?: Date | null;
    endTime?: Date | null;
    completed: boolean;
    subtasks?: Subtask[];
    attachments?: Attachment[];
    tags?: string[];
    activityLog?: ActivityLog[];
    prevTaskId?: string | null;
    nextTaskId?: string | null;
}