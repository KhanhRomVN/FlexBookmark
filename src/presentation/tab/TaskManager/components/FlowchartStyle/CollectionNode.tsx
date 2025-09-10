// src/presentation/components/TaskManager/FlowchartStyle/CollectionNode.tsx
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { FolderOpen, FileText, Calendar } from "lucide-react";
import type { CollectionNodeData } from "../../types/nodeTypes";

// Define props interface with consistent typing
interface CollectionNodeProps {
  data: CollectionNodeData;
  id: string;
  selected?: boolean;
  [key: string]: any;
}

const CollectionNode: React.FC<CollectionNodeProps> = ({ data }) => {
  // Type guard to ensure data has the expected structure
  if (!data || !data.collection || !data.tasks || !data.onClick) {
    console.error("CollectionNode: Invalid data structure", data);
    return null;
  }

  const { collection, tasks, onClick } = data;

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
        return "border-l-green-400";
      case "medium":
        return "border-l-yellow-400";
      case "high":
        return "border-l-orange-400";
      case "urgent":
        return "border-l-red-400";
      default:
        return "border-l-gray-400";
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Ensure tasks is an array
  const tasksList = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="shadow-lg rounded-lg bg-white border-2 border-indigo-200 min-w-[320px] max-w-[400px]">
      {/* Input handle */}
      <Handle type="target" position={Position.Top} className="w-4 h-4" />

      {/* Collection Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 rounded-t-lg">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">{collection}</h3>
        </div>
        <div className="text-xs text-indigo-700">
          {tasksList.length} task{tasksList.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {tasksList.map((task) => (
          <div
            key={task.id}
            className={`p-3 bg-gray-50 rounded-md border-l-4 ${getPriorityColor(
              task.priority
            )} hover:bg-gray-100 cursor-pointer transition-colors`}
            onClick={() => onClick(task)}
          >
            {/* Task header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(
                    task.status
                  )}`}
                ></div>
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-xs px-2 py-1 bg-white rounded-full border text-gray-600">
                {task.priority}
              </span>
            </div>

            {/* Task title */}
            <div className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
              {task.title}
            </div>

            {/* Task details */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {(task.dueDate || task.dueTime) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDate(task.dueDate)}
                      {task.dueTime &&
                        ` ${task.dueTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                    </span>
                  </div>
                )}
              </div>
              <span className="capitalize font-medium">
                {task.status.replace("-", " ")}
              </span>
            </div>

            {/* Subtasks info */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Subtasks: {task.subtasks.filter((st) => st.completed).length}/
                {task.subtasks.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} className="w-4 h-4" />
    </div>
  );
};

export default CollectionNode;
