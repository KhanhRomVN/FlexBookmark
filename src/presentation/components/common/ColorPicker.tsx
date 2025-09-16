import React, { useState, useRef, useEffect } from "react";
import { Palette, Plus } from "lucide-react";
import { createPortal } from "react-dom";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

// Predefined color options (17 colors to fill 5x3 + 2 spots, leaving last spot for custom)
const colorOptions = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F43F5E", // Rose
  "#64748B", // Slate
  "#78716C", // Stone
  "#DC2626", // Red-600
  "#059669", // Emerald-600
  "#A855F7", // Purple-500
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setShowCustomInput(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Dropdown dimensions (approximate)
      const dropdownWidth = 256; // min-w-64 = 16rem = 256px
      const dropdownHeight = showCustomInput ? 320 : 240;

      let top = buttonRect.bottom + 8;
      let left = buttonRect.left;

      // Adjust if dropdown would go off-screen
      if (top + dropdownHeight > viewportHeight) {
        top = buttonRect.top - dropdownHeight - 8;
      }

      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 16;
      }

      if (left < 16) {
        left = 16;
      }

      setDropdownPosition({ top, left });
    }
  }, [showDropdown, showCustomInput]);

  const handleCustomColorClick = () => {
    setShowCustomInput(!showCustomInput);
  };

  // Check if current value is one of the predefined colors
  const isCustomColor = !colorOptions.includes(value);

  const dropdownContent = showDropdown && (
    <div
      ref={dropdownRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 min-w-64 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 999999,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Choose Color
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-3">
        {/* Predefined colors */}
        {colorOptions.map((color) => (
          <button
            key={color}
            onClick={() => {
              onChange(color);
              setShowDropdown(false);
              setShowCustomInput(false);
            }}
            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
              value === color
                ? "border-white dark:border-gray-800 ring-2 ring-blue-500 scale-110"
                : "border-gray-200 dark:border-gray-600"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}

        {/* Custom color button */}
        <button
          onClick={handleCustomColorClick}
          className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center ${
            isCustomColor && value
              ? "border-white dark:border-gray-800 ring-2 ring-blue-500 scale-110"
              : "border-gray-200 dark:border-gray-600 hover:border-blue-400"
          } ${
            showCustomInput
              ? "bg-blue-50 dark:bg-blue-900/30"
              : "bg-gray-50 dark:bg-gray-700"
          }`}
          title="Custom Color"
        >
          {isCustomColor && value ? (
            <div
              className="w-6 h-6 rounded border border-white/50"
              style={{ backgroundColor: value }}
            />
          ) : (
            <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </button>
      </div>

      {/* Custom Color Input - Only show when custom button is clicked */}
      {showCustomInput && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Custom Color
          </label>
          <div className="relative">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
            />
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const color = e.target.value;
                if (
                  /^#[0-9A-F]{6}$/i.test(color) ||
                  /^#[0-9A-F]{3}$/i.test(color)
                ) {
                  onChange(color);
                }
              }}
              placeholder="#000000"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Color Picker Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:scale-105 flex items-center justify-center relative overflow-hidden group"
        style={{ backgroundColor: `${value}15` }}
      >
        <div
          className="w-6 h-6 rounded-lg border border-white/50 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 rounded-xl" />
      </button>

      {/* Render dropdown using portal to document.body */}
      {typeof document !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default ColorPicker;
