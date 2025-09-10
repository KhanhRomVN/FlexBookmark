import React from "react";
import { Activity } from "lucide-react";
import { Task } from "../../../../../types/task";

interface ActivityLogSectionProps {
  editedTask: Task;
}

const ActivityLogSection: React.FC<ActivityLogSectionProps> = ({
  editedTask,
}) => {
  return (
    <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
      {editedTask?.activityLog && editedTask.activityLog.length > 0 ? (
        editedTask.activityLog
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .map((activity, index) => (
            <div
              key={activity.id || index}
              className="p-4 rounded-lg border border-border-default hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity
                      size={12}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="font-semibold text-text-default text-sm capitalize">
                    {activity.action.replace("_", " ")}
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {new Date(activity.timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {activity.details}
              </p>
              {activity.userId && activity.userId !== "system" && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  by {activity.userId}
                </div>
              )}
            </div>
          ))
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No activity recorded yet
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Changes will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLogSection;
