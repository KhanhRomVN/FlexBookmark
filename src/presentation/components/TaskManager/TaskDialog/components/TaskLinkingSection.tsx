import React, { useRef, useState } from "react";
import { Link, ChevronDown } from "lucide-react";
import { Task } from "../../../../types/task";

interface TaskLinkingSectionProps {
  editedTask: Task;
  handleChange: (field: keyof Task, value: any) => void;
  availableTasks: Array<{ id: string; title: string; status: string }>;
}

const TaskLinkingSection: React.FC<TaskLinkingSectionProps> = ({
  editedTask,
  handleChange,
  availableTasks,
}) => {
  const prevTaskRef = useRef<HTMLDivElement>(null);
  const nextTaskRef = useRef<HTMLDivElement>(null);
  const [showPrevTaskList, setShowPrevTaskList] = useState(false);
  const [showNextTaskList, setShowNextTaskList] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg text-text-default">
          Task Linking
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex mb-2 text-sm font-medium text-text-secondary items-center gap-2">
            <Link size={16} />
            Previous Task
          </label>
          <div className="relative" ref={prevTaskRef}>
            <button
              className="w-full rounded-lg px-4 py-3 border border-border-default flex justify-between items-center text-text-default"
              onClick={() => setShowPrevTaskList(!showPrevTaskList)}
            >
              <span className="truncate">
                {editedTask.prevTaskId
                  ? availableTasks.find((t) => t.id === editedTask.prevTaskId)
                      ?.title || "Unknown Task"
                  : "Select previous task..."}
              </span>
              <ChevronDown size={16} />
            </button>
            {showPrevTaskList && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border-b border-border-default"
                  onClick={() => {
                    handleChange("prevTaskId", null);
                    setShowPrevTaskList(false);
                  }}
                >
                  <span className="text-gray-500">None</span>
                </button>
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={() => {
                      handleChange("prevTaskId", task.id);
                      setShowPrevTaskList(false);
                    }}
                  >
                    <div className="truncate">{task.title}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {task.status.replace("-", " ")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="mb-2 text-sm font-medium text-text-secondary flex items-center gap-2">
            <Link size={16} />
            Next Task
          </label>
          <div className="relative" ref={nextTaskRef}>
            <button
              className="w-full rounded-lg px-4 py-3 border border-border-default flex justify-between items-center text-text-default"
              onClick={() => setShowNextTaskList(!showNextTaskList)}
            >
              <span className="truncate">
                {editedTask.nextTaskId
                  ? availableTasks.find((t) => t.id === editedTask.nextTaskId)
                      ?.title || "Unknown Task"
                  : "Select next task..."}
              </span>
              <ChevronDown size={16} />
            </button>
            {showNextTaskList && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors border-b border-border-default"
                  onClick={() => {
                    handleChange("nextTaskId", null);
                    setShowNextTaskList(false);
                  }}
                >
                  <span className="text-gray-500">None</span>
                </button>
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={() => {
                      handleChange("nextTaskId", task.id);
                      setShowNextTaskList(false);
                    }}
                  >
                    <div className="truncate">{task.title}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {task.status.replace("-", " ")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskLinkingSection;
