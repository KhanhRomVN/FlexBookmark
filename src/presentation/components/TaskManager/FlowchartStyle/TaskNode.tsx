// src/presentation/components/TaskManager/Flowchart/TaskNode.tsx
import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import type { Task } from "../../../types/task";
import { Calendar, Clock, Paperclip, CheckSquare, Tag } from "lucide-react";

interface TaskNodeData extends Task {
  onClick: () => void;
}

const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "backlog":
        return "bg-gray-500";
      case "todo":
        return "bg-blue-500";
      case "in-progress":
        return "bg-yellow-500";
      case "overdue":
        return "bg-red-500";
      case "done":
        return "bg-green-500";
      case "archive":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const completedSubtasks =
    data.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = data.subtasks?.length || 0;
  const hasAttachments = data.attachments && data.attachments.length > 0;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="px-4 py-3 rounded-lg bg-card-background border border-border-default hover:border-border-hover min-w-[250px] max-w-[300px]">
      {/* Input handle */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Status indicator */}
      <div className="flex items-center justify-between mb-2">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}
        ></div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
            data.priority
          )} border`}
        >
          {data.priority}
        </span>
      </div>

      {/* Title */}
      <div
        className="font-semibold mb-2 text-text-primary cursor-pointer"
        onClick={data.onClick}
      >
        {data.title}
      </div>

      {/* Due date and time */}
      {(data.dueDate || data.dueTime) && (
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
          <Calendar className="w-3 h-3" />
          <span className="text-text-secondary">
            {formatDate(data.dueDate)}{" "}
            {data.dueTime &&
              data.dueTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
          </span>
        </div>
      )}

      {/* Subtasks and attachments */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {hasAttachments && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span>{data.attachments!.length}</span>
            </div>
          )}
        </div>

        <div className="text-xs font-medium capitalize">
          {data.status.replace("-", " ")}
        </div>
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default TaskNode;
