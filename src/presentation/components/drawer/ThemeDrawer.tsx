import React, { useState } from "react";
import { useTheme } from "../../providers/theme-provider";
import { PRESET_THEMES } from "./PresetTheme";
import MotionCustomDrawer from "../common/CustomDrawer";

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    backgroundImage,
    backgroundImages,
    setBackgroundImage,
    removeBackgroundImage,
    colorSettings,
    setColorSettings,
    imageThemeSettings,
    setImageThemeSettings,
  } = useTheme();
  const [urlInput, setUrlInput] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle uploading a custom background image
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

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.match("image.*")) {
        setError("Only image files are allowed");
        return;
      }
      handleImageUpload({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleAddFromUrl = () => {
    if (!urlInput) {
      setError("Please enter an image URL");
      return;
    }
    try {
      new URL(urlInput);
      setBackgroundImage(urlInput);
      setUrlInput("");
      setError(null);
    } catch {
      setError("Please enter a valid URL");
    }
  };

  // Apply preset color theme to CSS variables and state
  const applyPresetTheme = (preset: any) => {
    const root = document.documentElement;
    const cssVarMap: Record<string, string> = {
      primary: "--primary",
      background: "--background",
      textPrimary: "--text-primary",
      textSecondary: "--text-secondary",
      border: "--border",
      borderHover: "--border-hover",
      borderFocus: "--border-focus",
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
      const cssVar = cssVarMap[key];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value as string);
      }
    });
    setColorSettings(preset);
  };

  // Icons for theme modes
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
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707
           M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707
           M16 12a4 4 0 11-8 0 4 4 0 018 0z"
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
        d="M20.354 15.354A9 9 0 018.646 3.646
           9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
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
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16
           m-2-2l1.586-1.586a2 2 0 012.828 0L20 14
           m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2
           H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );

  // Theme mode buttons
  const renderThemeSelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Theme Mode</h3>
      <div className="grid grid-cols-3 gap-4">
        {["light", "dark", "image"].map((mode) => {
          const Icon =
            mode === "light"
              ? LightIcon
              : mode === "dark"
              ? DarkIcon
              : ImageIcon;
          return (
            <button
              key={mode}
              onClick={() => setTheme(mode as any)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                ${
                  theme === mode
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 dark:border-gray-700"
                }
                hover:bg-gray-50 dark:hover:bg-gray-800`}
            >
              <div
                className={`mb-2 p-2 rounded-full ${
                  mode === "light"
                    ? "bg-yellow-100 text-yellow-600"
                    : mode === "dark"
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                <Icon />
              </div>
              <span className="font-medium capitalize">{mode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Preset color swatches
  const renderPresetThemes = (t: "light" | "dark") => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Preset Themes</h3>
      <div className="grid grid-cols-2 gap-4">
        {PRESET_THEMES[t].map((preset, idx) => {
          const isSelected =
            colorSettings.primary === preset.primary &&
            colorSettings.background === preset.background &&
            colorSettings.cardBackground === preset.cardBackground;
          return (
            <button
              key={idx}
              onClick={() => applyPresetTheme(preset)}
              className={`relative flex flex-col p-4 rounded-2xl border transition-all overflow-hidden
                ${
                  isSelected
                    ? "border-primary ring-4 ring-primary/30 shadow-lg"
                    : "border-gray-200 dark:border-gray-700"
                }
                hover:shadow-md hover:scale-[1.02] duration-200`}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
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
              <div className="flex justify-between items-center w-full">
                <div>
                  <span className="font-medium text-sm block">
                    {preset.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {preset.description || "Modern theme"}
                  </span>
                </div>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293
                             a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293
                             a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex mt-3 gap-1 w-full">
                {["primary", "background", "cardBackground", "textPrimary"].map(
                  (k) => (
                    <div
                      key={k}
                      className="h-2 flex-1 rounded-full"
                      style={{ backgroundColor: (preset as any)[k] || "#000" }}
                    />
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Enhanced Background Images section
  const renderBackgroundSection = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Background Images</h3>

      {/* URL input with improved UX */}
      <div className="relative mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAddFromUrl()}
            placeholder="Enter image URL"
            className={`flex-1 h-10 px-3 border rounded-lg bg-input-background text-sm
              ${error ? "border-red-500" : "border-border"}`}
          />
          <button
            onClick={handleAddFromUrl}
            disabled={!urlInput}
            className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 112 0 1 1 0 00-2 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>

      {/* Enhanced dropzone */}
      <div
        className={`relative mb-4 flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all
          ${
            dragActive
              ? "border-primary bg-primary/10"
              : error
              ? "border-red-500 bg-red-500/5"
              : "border-border hover:border-primary/50"
          }
          ${backgroundImages.length > 0 ? "h-32" : "h-40"}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-2 mb-3 bg-gray-100 dark:bg-gray-800 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <p className="text-sm mb-1 font-medium">
            {dragActive ? "Drop your image here" : "Drag & drop image here"}
          </p>
          <p className="text-xs text-text-secondary">
            or{" "}
            <label className="text-primary cursor-pointer font-medium">
              browse files
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-xs text-text-secondary mt-1">
            JPG, PNG, GIF up to 10MB
          </p>
        </div>
      </div>

      {/* Enhanced gallery */}
      {backgroundImages.length > 0 && (
        <>
          <h4 className="text-md font-medium mb-3">Your Backgrounds</h4>
          <div className="grid grid-cols-3 gap-3">
            {backgroundImages.map((img, idx) => (
              <div
                key={idx}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                  ${
                    backgroundImage === img
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-transparent"
                  }`}
              >
                <img
                  onClick={() => setBackgroundImage(img)}
                  src={img}
                  alt={`bg-${idx}`}
                  className="w-full h-full object-cover cursor-pointer"
                />
                <button
                  onClick={() => removeBackgroundImage(img)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {backgroundImage === img && (
                  <div className="absolute bottom-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded">
                    Active
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Dashboard-specific image controls
  const renderDashboardSettings = () => (
    <div className="p-4 bg-card-background rounded-xl border border-border mb-6">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16
                   m-2-2l1.586-1.586a2 2 0 012.828 0L20 14
                   m-6-6h.01M6 20h12a2 2 0 002-2V6
                   a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Dashboard Settings
      </h4>

      {/* Background Blur */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Background Blur</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.blur}px
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Overlay Opacity */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Background Transparency</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.overlayOpacity}%
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Clock Gradient Picker */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Clock Gradient</span>
          <div className="flex gap-1">
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: imageThemeSettings.clockGradientFrom }}
            />
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: imageThemeSettings.clockGradientTo }}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[
            { from: "#ffffff", to: "#000000", name: "Default" },
            { from: "#ff7e5f", to: "#feb47b", name: "Sunset" },
            { from: "#6a11cb", to: "#2575fc", name: "Purple" },
            { from: "#11998e", to: "#38ef7d", name: "Green" },
            { from: "#fc5c7d", to: "#6a82fb", name: "Pink" },
            { from: "#ee9ca7", to: "#ffdde1", name: "Rose" },
          ].map((grad, idx) => (
            <button
              key={idx}
              onClick={() =>
                setImageThemeSettings({
                  ...imageThemeSettings,
                  clockGradientFrom: grad.from,
                  clockGradientTo: grad.to,
                })
              }
              className="flex flex-col items-center group"
            >
              <div
                className="w-10 h-10 rounded-lg border-2 border-border overflow-hidden mb-1
                            transition-all group-hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                }}
              />
              <span className="text-xs text-text-secondary group-hover:text-primary">
                {grad.name}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <label className="text-xs text-text-secondary block mb-1">
              From
            </label>
            <input
              type="color"
              value={imageThemeSettings.clockGradientFrom}
              onChange={(e) =>
                setImageThemeSettings({
                  ...imageThemeSettings,
                  clockGradientFrom: e.target.value,
                })
              }
              className="w-full h-8 border border-border bg-input-background rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-text-secondary block mb-1">To</label>
            <input
              type="color"
              value={imageThemeSettings.clockGradientTo}
              onChange={(e) =>
                setImageThemeSettings({
                  ...imageThemeSettings,
                  clockGradientTo: e.target.value,
                })
              }
              className="w-full h-8 border border-border bg-input-background rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Input Transparency */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Input Transparency</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.inputOpacity}%
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Dialog Transparency */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Dialog Transparency</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.dialogOpacity}%
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>
    </div>
  );

  // Bookmark-manager-specific image controls
  const renderBookmarkManagerSettings = () => (
    <div className="p-4 bg-card-background rounded-xl border border-border">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16
                   l-7-3.5L5 21V5z"
          />
        </svg>
        Bookmark Manager Settings
      </h4>

      {/* Background Blur */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Background Blur</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.bmBlur}px
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Overlay Transparency */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Overlay Transparency</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.bmOverlayOpacity}%
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Sidebar Transparency */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Sidebar Transparency</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.bmSidebarOpacity}%
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Card Transparency */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Card Transparency</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.bmCardOpacity}%
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Card Blur */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Card Blur</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.bmCardBlur}px
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>

      {/* Dialog Transparency */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Dialog Transparency</span>
          <span className="text-sm font-medium bg-button-second-bg px-2 py-1 rounded">
            {imageThemeSettings.bmDialogOpacity}%
          </span>
        </div>
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
          className="w-full h-2 bg-input-background rounded-full accent-primary"
        />
      </div>
    </div>
  );

  return (
    <MotionCustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Theme Settings"
      subtitle="Customize the look and feel of your app"
      size="lg"
      direction="right"
      animationType="elastic"
      enableBlur={true}
      closeOnOverlayClick={true}
      showCloseButton={true}
      overlayOpacity={0.3}
      headerActions={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2
                   h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12
                   a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343
                   M11 7.343l1.657-1.657a2 2 0 012.828 0
                   l2.829 2.829a2 2 0 010 2.828l-8.486 8.485
                   M7 17h.01"
          />
        </svg>
      }
      footerActions={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-button-second-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-button-bg text-button-text hover:bg-button-bg-hover transition-colors shadow-sm"
          >
            Apply Changes
          </button>
        </>
      }
    >
      <div className="h-full overflow-y-auto px-5 py-4">
        {renderThemeSelector()}

        {(theme === "light" || theme === "dark") && renderPresetThemes(theme)}

        {theme === "image" && (
          <>
            {renderBackgroundSection()}
            {renderDashboardSettings()}
            <div className="mt-6">{renderBookmarkManagerSettings()}</div>
          </>
        )}
      </div>
    </MotionCustomDrawer>
  );
};

export default ThemeDrawer;
