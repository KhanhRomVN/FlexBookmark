import React, { useState, useEffect } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { useTheme } from "../../providers/theme-provider";
import { PRESET_THEMES } from "./PresetTheme";

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    setBackgroundImage,
    backgroundImage,
    colorSettings,
    setColorSettings,
    imageThemeSettings,
    setImageThemeSettings,
  } = useTheme();

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

  // FIX: Apply all theme properties, not just 4
  const applyPresetTheme = (preset: any) => {
    // Apply ALL CSS variables from preset to root element
    const root = document.documentElement;

    // Map preset properties to CSS variables
    const cssVarMap = {
      primary: "--primary",
      background: "--background",
      textPrimary: "--text-primary",
      textSecondary: "--text-secondary",
      border: "--border",
      borderHover: "--border-hover",
      cardBackground: "--card-background",
      inputBackground: "--input-background",
      dialogBackground: "--dialog-background",
      dropdownBackground: "--dropdown-background",
      dropdownItemHover: "--dropdown-item-hover",
      sidebarBackground: "--sidebar-background",
      sidebarItemHover: "--sidebar-item-hover",
      sidebarItemFocus: "--sidebar-item-focus",
      buttonBg: "--button-bg",
      buttonBgHover: "--button-bg-hover",
      buttonText: "--button-text",
      buttonBorder: "--button-border",
      buttonBorderHover: "--button-border-hover",
      buttonSecondBg: "--button-second-bg",
      buttonSecondBgHover: "--button-second-bg-hover",
      bookmarkItemBg: "--bookmark-item-bg",
      bookmarkItemText: "--bookmark-item-text",
      drawerBackground: "--drawer-background",
      clockGradientFrom: "--clock-gradient-from",
      clockGradientTo: "--clock-gradient-to",
    };

    // Apply all CSS variables
    Object.entries(preset).forEach(([key, value]) => {
      const cssVar = cssVarMap[key as keyof typeof cssVarMap];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value as string);
      }
    });

    // Also update colorSettings for compatibility
    setColorSettings(preset);
  };

  // Theme mode icons
  const LightIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );

  const DarkIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );

  const ImageIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );

  const renderThemeSelector = () => (
    <div className="theme-selector mb-6">
      <h3 className="text-lg font-semibold mb-4">Theme Mode</h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            theme === "light"
              ? "border-primary ring-2 ring-primary/20"
              : "border-gray-200 dark:border-gray-700"
          } hover:bg-gray-50 dark:hover:bg-gray-800`}
          onClick={() => setTheme("light")}
        >
          <div className="mb-2 p-2 rounded-full bg-yellow-100 text-yellow-600">
            <LightIcon />
          </div>
          <span className="font-medium">Light</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            theme === "dark"
              ? "border-primary ring-2 ring-primary/20"
              : "border-gray-200 dark:border-gray-700"
          } hover:bg-gray-50 dark:hover:bg-gray-800`}
          onClick={() => setTheme("dark")}
        >
          <div className="mb-2 p-2 rounded-full bg-indigo-100 text-indigo-600">
            <DarkIcon />
          </div>
          <span className="font-medium">Dark</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            theme === "image"
              ? "border-primary ring-2 ring-primary/20"
              : "border-gray-200 dark:border-gray-700"
          } hover:bg-gray-50 dark:hover:bg-gray-800`}
          onClick={() => setTheme("image")}
        >
          <div className="mb-2 p-2 rounded-full bg-purple-100 text-purple-600">
            <ImageIcon />
          </div>
          <span className="font-medium">Image</span>
        </button>
      </div>
    </div>
  );

  const renderPresetThemes = (themeType: "light" | "dark") => (
    <div className="preset-themes mb-6">
      <h3 className="text-lg font-semibold mb-4">Preset Themes</h3>
      <div className="grid grid-cols-2 gap-4">
        {PRESET_THEMES[themeType].map((preset, index) => {
          const isSelected =
            colorSettings.primary === preset.primary &&
            colorSettings.background === preset.background &&
            colorSettings.cardBackground === preset.cardBackground;

          return (
            <button
              key={index}
              className={`relative flex flex-col items-start p-4 rounded-2xl border transition-all overflow-hidden group ${
                isSelected
                  ? "border-primary ring-4 ring-primary/30 shadow-lg"
                  : "border-gray-200 dark:border-gray-700"
              } hover:shadow-md hover:scale-[1.02] transition-transform duration-200`}
              onClick={() => applyPresetTheme(preset)}
            >
              {/* Glow effect for selected theme */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
              )}

              <div className="w-full h-24 rounded-lg overflow-hidden mb-3 border border-border relative">
                {/* Header */}
                <div
                  className="h-4 w-full"
                  style={{ backgroundColor: preset.primary }}
                ></div>

                <div className="flex h-20">
                  {/* Sidebar */}
                  <div
                    className="w-1/4 h-full"
                    style={{
                      backgroundColor:
                        preset.sidebarBackground || preset.cardBackground,
                    }}
                  ></div>

                  {/* Main content */}
                  <div
                    className="w-3/4 h-full p-2"
                    style={{ backgroundColor: preset.background }}
                  >
                    {/* Card preview */}
                    <div
                      className="w-full h-4 rounded mb-1"
                      style={{ backgroundColor: preset.cardBackground }}
                    ></div>
                    <div
                      className="w-3/4 h-4 rounded"
                      style={{ backgroundColor: preset.cardBackground }}
                    ></div>
                  </div>
                </div>

                {/* Floating icon */}
                <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/80 p-1.5 rounded-full">
                  {preset.icon ? (
                    <div className="text-lg">{preset.icon}</div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800"
                      style={{ backgroundColor: preset.primary }}
                    ></div>
                  )}
                </div>
              </div>

              <div className="flex items-start w-full">
                <div className="flex-1">
                  <span className="font-medium text-sm block text-left">
                    {preset.name}
                  </span>
                  <span className="text-xs text-text-secondary text-left block mt-1">
                    {preset.description || "Modern theme"}
                  </span>
                </div>

                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Color palette indicator */}
              <div className="flex mt-3 gap-1 w-full">
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.primary }}
                ></div>
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.background }}
                ></div>
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.cardBackground }}
                ></div>
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.textPrimary || "#000" }}
                ></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderImageSettings = () => (
    <div className="image-settings space-y-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Image Settings</h3>
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
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-input-background"
            />
            <label className="px-4 py-2 bg-button-bg text-button-text rounded-lg cursor-pointer transition hover:bg-button-bg-hover">
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
            value={imageThemeSettings.blur}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                blur: parseInt(e.target.value),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">{imageThemeSettings.blur}px</span>
        </div>
      </div>
      <div>
        <h4 className="font-medium mb-2">Background Brightness</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="200"
            value={imageThemeSettings.brightness}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                brightness: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.brightness}%
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Overlay Color</h4>
        <input
          type="text"
          value={imageThemeSettings.overlay}
          onChange={(e) =>
            setImageThemeSettings({
              ...imageThemeSettings,
              overlay: e.target.value,
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-input-background"
          placeholder="rgba(0,0,0,0.5)"
        />
      </div>

      <div>
        <h4 className="font-medium mb-2">Clock Color</h4>
        <div className="flex flex-wrap gap-2">
          {[
            "#ffffff",
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ffff00",
            "#ff00ff",
            "#00ffff",
          ].map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: color }}
              onClick={() =>
                setImageThemeSettings({
                  ...imageThemeSettings,
                  clockColor: color,
                })
              }
            />
          ))}
        </div>
        <input
          type="text"
          value={imageThemeSettings.clockColor}
          onChange={(e) =>
            setImageThemeSettings({
              ...imageThemeSettings,
              clockColor: e.target.value,
            })
          }
          className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-input-background"
        />
      </div>

      <div>
        <h4 className="font-medium mb-2">Input Background</h4>
        <input
          type="text"
          value={imageThemeSettings.inputBackground}
          onChange={(e) =>
            setImageThemeSettings({
              ...imageThemeSettings,
              inputBackground: e.target.value,
            })
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-input-background"
          placeholder="rgba(0,0,0,0.3)"
        />
      </div>

      <div>
        <h4 className="font-medium mb-2">Sidebar Opacity</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={imageThemeSettings.sidebarOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                sidebarOpacity: parseFloat(e.target.value),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {Math.round(imageThemeSettings.sidebarOpacity * 100)}%
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Card Opacity</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={imageThemeSettings.cardOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                cardOpacity: parseFloat(e.target.value),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {Math.round(imageThemeSettings.cardOpacity * 100)}%
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
      overlayClassName="z-[1500]"
      overlayOpacity={0.2}
    >
      <div className="h-full flex flex-col bg-drawer-background">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Theme Settings</h2>
          <p className="text-sm text-text-secondary">
            Customize the look and feel of your dashboard
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderThemeSelector()}
          {(theme === "light" || theme === "dark") && renderPresetThemes(theme)}
          {theme === "image" && renderImageSettings()}
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-button-second-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-button-bg text-button-text hover:bg-button-bg-hover transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default ThemeDrawer;
