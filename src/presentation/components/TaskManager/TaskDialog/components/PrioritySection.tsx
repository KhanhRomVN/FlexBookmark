import React from "react";
import { Priority } from "../../../../types/task";
import { Flag, Star } from "lucide-react";

interface PrioritySectionProps {
  editedTask: { priority: Priority };
  handleChange: (field: keyof any, value: any) => void;
}

const priorityColors = {
  low: "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md",
  medium: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md",
  high: "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md",
  urgent: "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md",
};

const priorityIcons = {
  low: <Flag size={14} />,
  medium: <Flag size={14} />,
  high: <Flag size={14} />,
  urgent: <Star size={14} />,
};

const PrioritySection: React.FC<PrioritySectionProps> = ({
  editedTask,
  handleChange,
}) => {
  return (
    <div>
      <label className="block mb-3 text-sm font-medium text-text-secondary">
        Priority Level
      </label>
      <div className="flex items-center gap-3">
        {(["low", "medium", "high", "urgent"] as Priority[]).map((level) => (
          <button
            key={level}
            onClick={() => handleChange("priority", level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
              editedTask.priority === level
                ? priorityColors[level]
                : "bg-button-secondBg text-text-secondary border border-border-default"
            }`}
          >
            {priorityIcons[level]}
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PrioritySection;
