import React from "react";
import { Priority, CalendarEvent } from "../../../../types/calendar";
import { Flag, Star } from "lucide-react";

interface PrioritySectionProps {
  editedTask: CalendarEvent; // Changed from editedEvent to editedTask to match usage
  handleChange: (field: keyof CalendarEvent, value: any) => void;
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
  editedTask, // Changed from editedEvent to editedTask
  handleChange,
}) => {
  return (
    <div>
      <label className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        Priority Level
      </label>
      <div className="flex items-center gap-3">
        {(["low", "medium", "high", "urgent"] as Priority[]).map((level) => (
          <button
            key={level}
            onClick={() => handleChange("priority", level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
              editedTask.priority === level // Changed from editedEvent to editedTask
                ? priorityColors[level]
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
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
