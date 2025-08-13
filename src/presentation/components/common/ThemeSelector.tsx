import React, { useState } from "react";
import { useTheme } from "@/presentation/providers/theme-provider";
import { Palette } from "lucide-react";

const ThemeSelector: React.FC = () => {
  const { theme, setTheme, setBackgroundImage, backgroundImage } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState(backgroundImage || "");

  const handleThemeChange = (selectedTheme: "light" | "dark" | "image") => {
    setTheme(selectedTheme);
    setShowDropdown(false);
  };

  const handleSaveImage = () => {
    if (imageUrl) {
      setBackgroundImage(imageUrl);
      setShowImageInput(false);
    }
  };

  return (
    <div className="theme-container relative">
      <button
        aria-label="Toggle theme"
        className="theme-btn w-8 h-8 rounded-full bg-background-secondary hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-primary transition flex items-center justify-center"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Palette className="w-5 h-5 text-text-primary" />
      </button>

      {showDropdown && (
        <div className="theme-dropdown absolute right-0 top-10 bg-dropdown-background rounded-md shadow-lg z-50 border min-w-[150px]">
          <button
            className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
            onClick={() => handleThemeChange("light")}
          >
            🌞 Light
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
            onClick={() => handleThemeChange("dark")}
          >
            🌙 Dark
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
            onClick={() => handleThemeChange("image")}
          >
            🖼️ Image
          </button>

          {theme === "image" && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
              onClick={() => setShowImageInput(!showImageInput)}
            >
              ✏️ Change Image
            </button>
          )}
        </div>
      )}

      {showImageInput && (
        <div className="image-url-container absolute right-0 top-16 bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 w-64">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
            className="w-full px-2 py-1 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded"
              onClick={() => setShowImageInput(false)}
            >
              Cancel
            </button>
            <button
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
              onClick={handleSaveImage}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
