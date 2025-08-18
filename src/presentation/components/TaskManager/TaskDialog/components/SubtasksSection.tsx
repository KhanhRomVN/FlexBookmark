import React from "react";
import { Plus, X, Check } from "lucide-react";
import { Subtask } from "../../../../types/task";

interface SubtasksSectionProps {
  editedTask: { subtasks?: Subtask[] };
  newSubtask: string;
  setNewSubtask: React.Dispatch<React.SetStateAction<string>>;
  handleSubtaskChange: (id: string, field: keyof Subtask, value: any) => void;
  handleAddSubtask: () => void;
  handleDeleteSubtask: (id: string) => void;
}

const SubtasksSection: React.FC<SubtasksSectionProps> = ({
  editedTask,
  newSubtask,
  setNewSubtask,
  handleSubtaskChange,
  handleAddSubtask,
  handleDeleteSubtask,
}) => {
  const completionPercentage =
    editedTask.subtasks && editedTask.subtasks.length > 0
      ? Math.round(
          (editedTask.subtasks.filter((st) => st.completed).length /
            editedTask.subtasks.length) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg text-text-default">Subtasks</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
        </div>
        {(editedTask.subtasks?.length ?? 0) > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {completionPercentage}% Complete
            </span>
            <div className="w-24 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {editedTask.subtasks?.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-4 p-2 bg-button-secondBg hover:bg-button-secondBgHover rounded-lg transition-all duration-200 border-b border-border-default"
          >
            <button
              onClick={() =>
                handleSubtaskChange(subtask.id, "completed", !subtask.completed)
              }
              className={`h-4 w-4 rounded-lg flex items-center justify-center transition-all duration-200 ${
                subtask.completed
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                  : "border-2 border-gray-300 dark:border-gray-600 hover:border-green-400"
              }`}
            >
              {subtask.completed && <Check size={14} />}
            </button>
            <input
              value={subtask.title}
              onChange={(e) =>
                handleSubtaskChange(subtask.id, "title", e.target.value)
              }
              className={`flex-1 bg-transparent border-none focus:ring-0 transition-all ${
                subtask.completed
                  ? "text-text-secondary line-through"
                  : "text-text-default"
              }`}
              placeholder="Subtask title"
            />
            <button
              onClick={() => handleDeleteSubtask(subtask.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        <div className="flex gap-3 mt-4">
          <input
            placeholder="Add new subtask..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            className="flex-1 bg-input-background rounded-lg px-4 py-3 border border-border-default text-text-default"
            onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
          />
          <button
            onClick={handleAddSubtask}
            className="flex items-center gap-2 bg-button-bg hover:bg-button-bgHover text-button-bgText px-6 py-3 rounded-lg font-medium"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubtasksSection;
