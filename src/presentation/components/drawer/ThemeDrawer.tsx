// FlexBookmark/src/presentation/components/drawer/ThemeDrawer.tsx
import React, { useState, useEffect } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { useTheme } from "@/presentation/providers/theme-provider";

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, setBackgroundImage, backgroundImage } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "theme" | "light" | "dark" | "image"
  >("theme");
  const [imageSettings, setImageSettings] = useState({
    blur: 2,
    dim: 0.3,
    overlay: "#000000",
    opacity: 0.2,
  });

  const [colorSettings, setColorSettings] = useState({
    primary: "#3686ff",
    background: "#ffffff",
    cardBackground: "#ffffff",
  });

  const presetColors = [
    "#3686ff", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
  ];

  const presetBackgrounds = {
    light: [
      "#ffffff", // White
      "#f9fafb", // Light gray
      "#f3f4f6", // Gray
      "#f1f5f9", // Light blue
      "#fffbeb", // Light yellow
    ],
    dark: [
      "#0a0a0a", // Black
      "#111827", // Dark gray
      "#1e293b", // Slate
      "#1e1e1e", // Charcoal
      "#0f172a", // Navy
    ],
  };

  // Apply image settings to CSS variables
  useEffect(() => {
    if (theme === "image" && backgroundImage) {
      document.documentElement.style.setProperty(
        "--background",
        `linear-gradient(rgba(0, 0, 0, ${imageSettings.dim}), url(${backgroundImage})`
      );
      document.documentElement.style.setProperty(
        "background-blur",
        `${imageSettings.blur}px`
      );
      document.documentElement.style.setProperty(
        "--overlay-color",
        `${imageSettings.overlay}${Math.round(
          imageSettings.opacity * 255
        ).toString(16)}`
      );
    }
  }, [theme, backgroundImage, imageSettings]);

  // Apply color settings when theme changes
  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      document.documentElement.style.setProperty(
        "--primary",
        colorSettings.primary
      );
      document.documentElement.style.setProperty(
        "--background",
        colorSettings.background
      );
      document.documentElement.style.setProperty(
        "--card-background",
        colorSettings.cardBackground
      );
    }
  }, [theme, colorSettings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBackgroundImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSettingsChange = (
    field: keyof typeof imageSettings,
    value: any
  ) => {
    setImageSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleColorSettingsChange = (
    field: keyof typeof colorSettings,
    value: string
  ) => {
    setColorSettings((prev) => ({ ...prev, [field]: value }));
  };

  const renderThemeSelector = () => (
    <div className="theme-selector">
      <h3 className="text-lg font-semibold mb-4">Select Theme</h3>
      <div className="grid grid-cols-3 gap-4">
        <button
          className={`theme-option p-4 rounded-lg border transition-all ${
            theme === "light"
              ? "border-primary ring-2 ring-primary"
              : "border-gray-200"
          }`}
          onClick={() => setTheme("light")}
        >
          <div className="w-full h-20 bg-white rounded mb-2"></div>
          <span>Light</span>
        </button>
        <button
          className={`theme-option p-4 rounded-lg border transition-all ${
            theme === "dark"
              ? "border-primary ring-2 ring-primary"
              : "border-gray-200"
          }`}
          onClick={() => setTheme("dark")}
        >
          <div className="w-full h-20 bg-gray-900 rounded mb-2"></div>
          <span>Dark</span>
        </button>
        <button
          className={`theme-option p-4 rounded-lg border transition-all ${
            theme === "image"
              ? "border-primary ring-2 ring-primary"
              : "border-gray-200"
          }`}
          onClick={() => {
            setTheme("image");
            setActiveTab("image");
          }}
        >
          <div className="w-full h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded mb-2"></div>
          <span>Image</span>
        </button>
      </div>
    </div>
  );

  const renderColorSettings = () => (
    <div className="color-settings space-y-6">
      <div>
        <h4 className="font-medium mb-2">Primary Color</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {presetColors.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border ${
                colorSettings.primary === color
                  ? "ring-2 ring-offset-2 ring-primary"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSettingsChange("primary", color)}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: colorSettings.primary }}
          ></div>
          <input
            type="text"
            value={colorSettings.primary}
            onChange={(e) =>
              handleColorSettingsChange("primary", e.target.value)
            }
            className="flex-1 px-3 py-1 rounded border border-gray-300"
          />
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Background Color</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {presetBackgrounds[activeTab].map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded border ${
                colorSettings.background === color
                  ? "ring-2 ring-offset-2 ring-primary"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSettingsChange("background", color)}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: colorSettings.background }}
          ></div>
          <input
            type="text"
            value={colorSettings.background}
            onChange={(e) =>
              handleColorSettingsChange("background", e.target.value)
            }
            className="flex-1 px-3 py-1 rounded border border-gray-300"
          />
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Card Background</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {presetBackgrounds[activeTab].map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded border ${
                colorSettings.cardBackground === color
                  ? "ring-2 ring-offset-2 ring-primary"
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSettingsChange("cardBackground", color)}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: colorSettings.cardBackground }}
          ></div>
          <input
            type="text"
            value={colorSettings.cardBackground}
            onChange={(e) =>
              handleColorSettingsChange("cardBackground", e.target.value)
            }
            className="flex-1 px-3 py-1 rounded border border-gray-300"
          />
        </div>
      </div>
    </div>
  );

  const renderImageSettings = () => (
    <div className="image-settings space-y-6">
      <div>
        <h4 className="font-medium mb-2">Background Image</h4>
        <div className="flex flex-col gap-4">
          {backgroundImage && (
            <div className="w-full h-40 rounded-lg overflow-hidden border">
              <img
                src={backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Image URL"
              value={backgroundImage || ""}
              onChange={(e) => setBackgroundImage(e.target.value)}
              className="flex-1 px-3 py-1 rounded border border-gray-300"
            />
            <label className="px-4 py-1 bg-primary text-white rounded cursor-pointer">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Background Blur</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="20"
            value={imageSettings.blur}
            onChange={(e) =>
              handleImageSettingsChange("blur", parseInt(e.target.value))
            }
            className="w-full"
          />
          <span className="w-10 text-center">{imageSettings.blur}px</span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Background Dim</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={imageSettings.dim}
            onChange={(e) =>
              handleImageSettingsChange("dim", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <span className="w-10 text-center">
            {Math.round(imageSettings.dim * 100)}%
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Overlay Color</h4>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={imageSettings.overlay}
            onChange={(e) =>
              handleImageSettingsChange("overlay", e.target.value)
            }
            className="w-10 h-10 p-0 border-0"
          />
          <input
            type="text"
            value={imageSettings.overlay}
            onChange={(e) =>
              handleImageSettingsChange("overlay", e.target.value)
            }
            className="flex-1 px-3 py-1 rounded border border-gray-300"
          />
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Overlay Opacity</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={imageSettings.opacity}
            onChange={(e) =>
              handleImageSettingsChange("opacity", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <span className="w-10 text-center">
            {Math.round(imageSettings.opacity * 100)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      direction="right"
      size="25vw"
      className="theme-drawer"
      overlayOpacity={0.2}
    >
      <div className="h-full flex flex-col bg-sidebar-background border-l border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <h2 className="text-xl font-bold">Theme Settings</h2>
          <p className="text-sm text-text-secondary">
            Customize the look and feel of your dashboard
          </p>
        </div>

        <div className="flex border-b border-sidebar-border">
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "theme"
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary"
            }`}
            onClick={() => setActiveTab("theme")}
          >
            Theme
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "light"
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary"
            }`}
            onClick={() => setActiveTab("light")}
            disabled={theme === "image"}
          >
            Light Theme
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "dark"
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary"
            }`}
            onClick={() => setActiveTab("dark")}
            disabled={theme === "image"}
          >
            Dark Theme
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "image"
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary"
            }`}
            onClick={() => setActiveTab("image")}
          >
            Image Theme
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "theme" && renderThemeSelector()}
          {(activeTab === "light" || activeTab === "dark") &&
            renderColorSettings()}
          {activeTab === "image" && renderImageSettings()}
        </div>

        <div className="p-4 border-t border-sidebar-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default ThemeDrawer;
