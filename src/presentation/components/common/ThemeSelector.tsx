import React, { useState } from "react";
import { useTheme } from "@/presentation/providers/theme-provider";
import { Palette } from "lucide-react";

const ThemeSelector: React.FC = () => {
  const { theme, setTheme, setBackgroundImage, backgroundImage } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleThemeChange = (selectedTheme: "light" | "dark" | "image") => {
    setTheme(selectedTheme);
    setShowDropdown(false);
  };

  // prompt user for image URL using browser dialog
  const handleChangeImage = () => {
    const url = window.prompt(
      "Enter background image URL",
      backgroundImage || ""
    );
    if (url) {
      setBackgroundImage(url);
    }
    setShowDropdown(false);
  };

  return (
    <div className="theme-container relative">
      <button
        type="button"
        aria-label="Toggle theme"
        className="theme-btn w-8 h-8 rounded-full bg-background-secondary hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-primary transition flex items-center justify-center"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Palette className="w-5 h-5 text-text-primary" />
      </button>

      {showDropdown && (
        <div className="theme-dropdown absolute right-0 top-10 bg-dropdown-background rounded-md shadow-lg z-50 border min-w-[150px]">
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
            onClick={() => handleThemeChange("light")}
          >
            🌞 Light
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
            onClick={() => handleThemeChange("dark")}
          >
            🌙 Dark
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
            onClick={() => handleThemeChange("image")}
          >
            🖼️ Image
          </button>

          {theme === "image" && (
            <button
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover flex items-center gap-2"
              onClick={handleChangeImage}
            >
              ✏️ Change Image
            </button>
          )}
        </div>
      )}

      {/* no floating input; using browser prompt */}
    </div>
  );
};

export default ThemeSelector;
