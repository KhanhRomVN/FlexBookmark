import React from "react";
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

  // Apply preset theme colors to CSS variables
  const applyPresetTheme = (preset: any) => {
    const root = document.documentElement;
    const cssVarMap = {
      primary: "--primary",
      background: "--background",
      textPrimary: "--text-primary",
      textSecondary: "--text-secondary",
      border: "--border",
      borderHover: "--border-hover",
      cardBackground: "--card-background",
      cardShadow: "--card-shadow",
      inputBackground: "--input-background",
      dialogBackground: "--dialog-background",
      dialogShadow: "--dialog-shadow",
      dropdownBackground: "--dropdown-background",
      dropdownItemHover: "--dropdown-item-hover",
      dropdownItemFocus: "--dropdown-item-focus",
      dropdownShadow: "--dropdown-shadow",
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
    Object.entries(preset).forEach(([key, value]) => {
      const cssVar = (cssVarMap as any)[key];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value as string);
      }
    });
    setColorSettings(preset);
  };

  // Icons
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

  // Theme mode selector
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

  // Preset themes
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
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
              )}
              <div className="w-full h-24 rounded-lg overflow-hidden mb-3 border border-border relative">
                <div
                  className="h-4 w-full"
                  style={{ backgroundColor: preset.primary }}
                />
                <div className="flex h-20">
                  <div
                    className="w-1/4 h-full"
                    style={{
                      backgroundColor:
                        preset.sidebarBackground || preset.cardBackground,
                    }}
                  />
                  <div
                    className="w-3/4 h-full p-2"
                    style={{ backgroundColor: preset.background }}
                  >
                    <div
                      className="w-full h-4 rounded mb-1"
                      style={{ backgroundColor: preset.cardBackground }}
                    />
                    <div
                      className="w-3/4 h-4 rounded"
                      style={{ backgroundColor: preset.cardBackground }}
                    />
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/80 p-1.5 rounded-full">
                  {preset.icon ? (
                    <div className="text-lg">{preset.icon}</div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800"
                      style={{ backgroundColor: preset.primary }}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-start w-full">
                <div className="flex-1">
                  <span className="font-medium text-sm block text-left">
                    {preset.name}
                  </span>
                  <span className="text-xs text-text-secondary block mt-1">
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
              <div className="flex mt-3 gap-1 w-full">
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.primary }}
                />
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.background }}
                />
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.cardBackground }}
                />
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: preset.textPrimary || "#000" }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Dashboard-specific settings
  const renderDashboardSettings = () => (
    <div className="space-y-6 mb-6">
      <h4 className="font-medium mb-2">Dashboard Settings</h4>
      {/* Background Blur */}
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
                blur: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">{imageThemeSettings.blur}px</span>
        </div>
      </div>
      {/* Overlay Opacity */}
      <div>
        <h4 className="font-medium mb-2">Background Transparency</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={imageThemeSettings.overlayOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                overlayOpacity: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.overlayOpacity}%
          </span>
        </div>
      </div>

      {/* Clock Gradient */}
      <div>
        <h4 className="font-medium mb-2">Clock Gradient</h4>
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            { from: "#ffffff", to: "#000000" },
            { from: "#ff7e5f", to: "#feb47b" },
            { from: "#6a11cb", to: "#2575fc" },
            { from: "#11998e", to: "#38ef7d" },
            { from: "#fc5c7d", to: "#6a82fb" },
            { from: "#ee9ca7", to: "#ffdde1" },
            { from: "#2193b0", to: "#6dd5ed" },
          ].map((grad, idx) => (
            <button
              key={idx}
              className="w-16 h-8 rounded-lg border-2 border-gray-300 overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(to right, ${grad.from}, ${grad.to})`,
              }}
              onClick={() =>
                setImageThemeSettings({
                  ...imageThemeSettings,
                  clockGradientFrom: grad.from,
                  clockGradientTo: grad.to,
                })
              }
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="color"
            value={imageThemeSettings.clockGradientFrom}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                clockGradientFrom: e.target.value,
              })
            }
            className="flex-1 w-12 h-10 p-0 border-0 bg-transparent"
          />
          <input
            type="color"
            value={imageThemeSettings.clockGradientTo}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                clockGradientTo: e.target.value,
              })
            }
            className="flex-1 w-12 h-10 p-0 border-0 bg-transparent"
          />
        </div>
      </div>
      {/* Input Transparency */}
      <div>
        <h4 className="font-medium mb-2">Input Transparency</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={imageThemeSettings.inputOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                inputOpacity: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.inputOpacity}%
          </span>
        </div>
      </div>
      {/* Dialog Transparency */}
      <div>
        <h4 className="font-medium mb-2">Dialog Transparency</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={imageThemeSettings.dialogOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                dialogOpacity: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.dialogOpacity}%
          </span>
        </div>
      </div>
    </div>
  );

  // Bookmark-manager-specific settings
  const renderBookmarkManagerSettings = () => (
    <div className="space-y-6 mb-6">
      <h4 className="font-medium mb-2">Bookmark Manager Settings</h4>
      {/* Background Blur */}
      <div>
        <h4 className="font-medium mb-2">Background Blur</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="20"
            value={imageThemeSettings.bmBlur}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                bmBlur: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.bmBlur}px
          </span>
        </div>
      </div>
      {/* Overlay Opacity */}
      <div>
        <h4 className="font-medium mb-2">Overlay Transparency</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={imageThemeSettings.bmOverlayOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                bmOverlayOpacity: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.bmOverlayOpacity}%
          </span>
        </div>
      </div>
      {/* Sidebar Transparency */}
      <div>
        <h4 className="font-medium mb-2">Sidebar Transparency</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={imageThemeSettings.bmSidebarOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                bmSidebarOpacity: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.bmSidebarOpacity}%
          </span>
        </div>
      </div>
      {/* Card Transparency */}
      <div>
        <h4 className="font-medium mb-2">Card Transparency</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={imageThemeSettings.bmCardOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                bmCardOpacity: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.bmCardOpacity}%
          </span>
        </div>
      </div>
      {/* Card Blur */}
      <div>
        <h4 className="font-medium mb-2">Card Blur</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="20"
            value={imageThemeSettings.bmCardBlur}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                bmCardBlur: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.bmCardBlur}px
          </span>
        </div>
      </div>
      {/* Dialog Transparency */}
      <div>
        <h4 className="font-medium mb-2">Dialog Transparency</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={imageThemeSettings.bmDialogOpacity}
            onChange={(e) =>
              setImageThemeSettings({
                ...imageThemeSettings,
                bmDialogOpacity: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-primary"
          />
          <span className="w-10 text-center">
            {imageThemeSettings.bmDialogOpacity}%
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
      overlayOpacity={0}
    >
      <div className="h-full flex flex-col bg-drawer-background">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Theme Settings</h2>
          <p className="text-sm text-text-secondary">
            Customize the look and feel of your app
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderThemeSelector()}

          {(theme === "light" || theme === "dark") && renderPresetThemes(theme)}

          {theme === "image" && (
            <>
              <h3 className="text-lg font-semibold mb-4">
                Dashboard Image Customization
              </h3>
              {renderDashboardSettings()}
              <h3 className="text-lg font-semibold mb-4 mt-6">
                Bookmark Manager Image Customization
              </h3>
              {renderBookmarkManagerSettings()}
            </>
          )}
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
