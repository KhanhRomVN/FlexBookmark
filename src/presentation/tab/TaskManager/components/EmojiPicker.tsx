import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

// Emoji categories with organized emojis
const emojiCategories = {
  finance: {
    label: "Finance",
    icon: "💰",
    emojis: [
      "💰",
      "💵",
      "💳",
      "🏦",
      "💸",
      "💎",
      "👛",
      "👜",
      "💼",
      "🏧",
      "📊",
      "📈",
      "📉",
      "🪙",
      "💴",
      "💶",
      "💷",
      "💲",
    ],
  },
  lifestyle: {
    label: "Lifestyle",
    icon: "🏠",
    emojis: [
      "🏠",
      "🚗",
      "✈️",
      "🍽️",
      "☕",
      "🛍️",
      "👕",
      "👟",
      "🎭",
      "🎪",
      "🎨",
      "🎵",
      "🎬",
      "📱",
      "💻",
      "⌚",
    ],
  },
  activities: {
    label: "Activities",
    icon: "🎯",
    emojis: [
      "🎯",
      "🎓",
      "📚",
      "🏋️",
      "⚽",
      "🏀",
      "🎾",
      "🏊",
      "🚴",
      "🎮",
      "🎲",
      "🎸",
      "📸",
      "✈️",
      "🏖️",
      "⛰️",
    ],
  },
  symbols: {
    label: "Symbols",
    icon: "⭐",
    emojis: [
      "⭐",
      "❤️",
      "💙",
      "💚",
      "💛",
      "🧡",
      "💜",
      "🖤",
      "🤍",
      "🔥",
      "⚡",
      "💫",
      "✨",
      "🌟",
      "💯",
      "🎁",
    ],
  },
  objects: {
    label: "Objects",
    icon: "🔧",
    emojis: [
      "🔧",
      "🔨",
      "⚙️",
      "🛠️",
      "🔑",
      "🗝️",
      "💡",
      "🔍",
      "📝",
      "📋",
      "📌",
      "📎",
      "🖇️",
      "📁",
      "📂",
      "🗂️",
    ],
  },
  food: {
    label: "Food & Drinks",
    icon: "🍕",
    emojis: [
      "🍕",
      "🍔",
      "🍟",
      "🌭",
      "🥙",
      "🌮",
      "🌯",
      "🥗",
      "🍝",
      "🍜",
      "🍲",
      "🍱",
      "🍙",
      "🍘",
      "🥘",
      "🍗",
      "🥓",
      "🍖",
      "🌶️",
      "🥕",
      "🍅",
      "🥒",
      "🥬",
      "🥦",
      "🧄",
      "🧅",
      "🍇",
      "🍓",
      "🍎",
      "🍊",
      "🍌",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍑",
      "🍒",
      "🫐",
      "🍰",
      "🎂",
      "🧁",
      "🍪",
      "🍩",
      "🍫",
      "🍬",
      "🍭",
      "☕",
      "🍵",
      "🥤",
      "🧃",
      "🥛",
      "🍷",
      "🍺",
      "🍻",
      "🥂",
      "🍾",
    ],
  },
  nature: {
    label: "Nature & Weather",
    icon: "🌿",
    emojis: [
      "🌿",
      "🌱",
      "🌳",
      "🌲",
      "🌴",
      "🌵",
      "🌾",
      "🌻",
      "🌺",
      "🌸",
      "🌷",
      "🌹",
      "🥀",
      "🌼",
      "💐",
      "🍀",
      "🍃",
      "🍂",
      "🍁",
      "🌊",
      "🏔️",
      "⛰️",
      "🗻",
      "🏞️",
      "🏜️",
      "🏖️",
      "⛱️",
      "🌋",
      "🏝️",
      "☀️",
      "🌤️",
      "⛅",
      "🌦️",
      "🌧️",
      "⛈️",
      "🌩️",
      "🌨️",
      "❄️",
      "☃️",
      "⛄",
      "🌬️",
      "💨",
      "🌪️",
      "🌈",
      "☔",
      "💧",
      "🌙",
      "🌛",
      "🌜",
      "🌚",
      "🌝",
      "🌞",
      "⭐",
      "🌟",
      "💫",
      "⚡",
      "🔥",
      "❄️",
    ],
  },
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<keyof typeof emojiCategories>("finance");
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

      // Dropdown dimensions (approximate) - Updated for smaller height
      const dropdownWidth = 350; // 60 + 290
      const dropdownHeight = 300; // Reduced from 400 to 300

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
  }, [showDropdown]);

  const currentEmojis = emojiCategories[activeCategory].emojis;

  const dropdownContent = showDropdown && (
    <div
      ref={dropdownRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 999999,
      }}
    >
      <div className="flex">
        {/* Category Sidebar with limited height for ~5 categories */}
        <div className="w-15 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-60 overflow-y-auto">
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key as keyof typeof emojiCategories);
              }}
              className={`p-3 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ${
                activeCategory === key
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              title={category.label}
            >
              {category.icon}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="w-72 bg-white dark:bg-gray-800 h-60 flex flex-col">
          {/* Header */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {emojiCategories[activeCategory].label}
              </span>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Emoji Grid */}
          <div className="p-4 flex-1 overflow-hidden">
            <div className="grid grid-cols-8 gap-1 h-full overflow-y-auto">
              {currentEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => {
                    onChange(emoji);
                    setShowDropdown(false);
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 ${
                    value === emoji
                      ? "bg-blue-100 dark:bg-blue-900/20 ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Emoji Picker Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:scale-105 flex items-center justify-center text-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        {value || "😀"}
      </button>

      {/* Render dropdown using portal to document.body */}
      {typeof document !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default EmojiPicker;
