// src/presentation/components/TaskManager/TaskDialog/components/RestoreConfirmationDialog.tsx
import React from "react";
import { Status } from "../../../../../types/task";

interface RestoreConfirmationDialogProps {
  isOpen: boolean;
  taskTitle: string;
  targetStatus: Status;
  onConfirm: () => void;
  onCancel: () => void;
}

const RestoreConfirmationDialog: React.FC<RestoreConfirmationDialogProps> = ({
  isOpen,
  taskTitle,
  targetStatus,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const statusLabels: Record<string, string> = {
    backlog: "Backlog",
    todo: "To Do",
    "in-progress": "In Progress",
    overdue: "Overdue",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cannot Restore Completed Task
          </h3>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            <strong>"{taskTitle}"</strong> is already completed. Google Tasks
            doesn't support directly changing completed tasks back to other
            statuses.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Would you like to create a new task with the same content in{" "}
            <strong>"{statusLabels[targetStatus] || targetStatus}"</strong>{" "}
            status instead?
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>What will happen:</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• A new task "{taskTitle} (Restored)" will be created</li>
              <li>• All content, subtasks, and attachments will be copied</li>
              <li>• The original completed task will remain in Done</li>
              <li>
                • The new task will be placed in{" "}
                {statusLabels[targetStatus] || targetStatus}
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> This limitation is due to Google Tasks API
              restrictions. You can manually delete the original completed task
              later if desired.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create New Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreConfirmationDialog;
