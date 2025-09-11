import React, { useState } from "react";
import { Search, X } from "lucide-react";

const CATEGORY_ICONS = [
  "🍔",
  "🛒",
  "🚗",
  "🎬",
  "🏥",
  "📚",
  "🧾",
  "💸",
  "💼",
  "🎁",
  "📈",
  "🎀",
  "💰",
  "🏠",
  "✈️",
  "🎓",
  "💻",
  "📱",
  "🎮",
  "🎨",
  "⚽",
  "🎵",
  "🍎",
  "☕",
];

interface CategoryIconPickerProps {
  selectedIcon: string;
  onIconSelect: (icon: string) => void;
}

export const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({
  selectedIcon,
  onIconSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = CATEGORY_ICONS.filter((icon) =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
        {filteredIcons.map((icon) => (
          <button
            key={icon}
            onClick={() => onIconSelect(icon)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-gray-100 ${
              selectedIcon === icon
                ? "bg-blue-100 border-2 border-blue-500"
                : "border border-gray-200"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};
