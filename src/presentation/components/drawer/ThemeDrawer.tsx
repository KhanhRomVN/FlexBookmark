import React, { useState, useEffect } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { useTheme } from "../../providers/theme-provider";
import { FiChevronLeft } from "react-icons/fi";

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_THEMES = {
  light: [
    {
      name: "Default Light",
      primary: "#3686ff",
      background: "#ffffff",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      border: "#e2e8f0",
      borderHover: "#cbd5e1",
      cardBackground: "#ffffff",
      cardShadow: "rgba(0, 0, 0, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(0, 0, 0, 0.1)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#f8fafc",
      dropdownItemFocus: "#e2e8f0",
      dropdownShadow: "rgba(0, 0, 0, 0.1)",
      sidebarBackground: "#f9fafb",
      sidebarItemHover: "#f3f4f6",
      sidebarItemFocus: "#e5e7eb",
      buttonBg: "#3686ff",
      buttonBgHover: "#1d4ed8",
      buttonText: "#ffffff",
      buttonBorder: "#2563eb",
      buttonBorderHover: "#1e40af",
      buttonSecondBg: "#d4d4d4",
      buttonSecondBgHover: "#b6b6b6",
      bookmarkItemBg: "#f1f5f9",
      bookmarkItemText: "#0f172a",
      drawerBackground: "#ffffff",
    },
    {
      name: "Blue Light",
      primary: "#1e40af",
      background: "#eff6ff",
      textPrimary: "#1e3a8a",
      textSecondary: "#3730a3",
      border: "#bfdbfe",
      borderHover: "#93c5fd",
      cardBackground: "#ffffff",
      cardShadow: "rgba(30, 64, 175, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(30, 64, 175, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#dbeafe",
      dropdownItemFocus: "#bfdbfe",
      dropdownShadow: "rgba(30, 64, 175, 0.1)",
      sidebarBackground: "#dbeafe",
      sidebarItemHover: "#bfdbfe",
      sidebarItemFocus: "#93c5fd",
      buttonBg: "#1e40af",
      buttonBgHover: "#1e3a8a",
      buttonText: "#ffffff",
      buttonBorder: "#1d4ed8",
      buttonBorderHover: "#1e3a8a",
      buttonSecondBg: "#e0e7ff",
      buttonSecondBgHover: "#c7d2fe",
      bookmarkItemBg: "#dbeafe",
      bookmarkItemText: "#1e3a8a",
      drawerBackground: "#ffffff",
    },
    {
      name: "Emerald Light",
      primary: "#10b981",
      background: "#ecfdf5",
      textPrimary: "#064e3b",
      textSecondary: "#047857",
      border: "#a7f3d0",
      borderHover: "#6ee7b7",
      cardBackground: "#ffffff",
      cardShadow: "rgba(16, 185, 129, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(16, 185, 129, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#d1fae5",
      dropdownItemFocus: "#a7f3d0",
      dropdownShadow: "rgba(16, 185, 129, 0.1)",
      sidebarBackground: "#d1fae5",
      sidebarItemHover: "#a7f3d0",
      sidebarItemFocus: "#6ee7b7",
      buttonBg: "#10b981",
      buttonBgHover: "#059669",
      buttonText: "#ffffff",
      buttonBorder: "#059669",
      buttonBorderHover: "#047857",
      buttonSecondBg: "#d1fae5",
      buttonSecondBgHover: "#a7f3d0",
      bookmarkItemBg: "#d1fae5",
      bookmarkItemText: "#064e3b",
      drawerBackground: "#ffffff",
    },
    {
      name: "Rose Light",
      primary: "#e11d48",
      background: "#fff1f2",
      textPrimary: "#881337",
      textSecondary: "#be185d",
      border: "#fbb6ce",
      borderHover: "#f9a8d4",
      cardBackground: "#ffffff",
      cardShadow: "rgba(225, 29, 72, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(225, 29, 72, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#fce7f3",
      dropdownItemFocus: "#fbcfe8",
      dropdownShadow: "rgba(225, 29, 72, 0.1)",
      sidebarBackground: "#fce7f3",
      sidebarItemHover: "#fbcfe8",
      sidebarItemFocus: "#f9a8d4",
      buttonBg: "#e11d48",
      buttonBgHover: "#be123c",
      buttonText: "#ffffff",
      buttonBorder: "#be123c",
      buttonBorderHover: "#9f1239",
      buttonSecondBg: "#fce7f3",
      buttonSecondBgHover: "#fbcfe8",
      bookmarkItemBg: "#fce7f3",
      bookmarkItemText: "#881337",
      drawerBackground: "#ffffff",
    },
    {
      name: "Violet Light",
      primary: "#7c3aed",
      background: "#faf5ff",
      textPrimary: "#581c87",
      textSecondary: "#6b21a8",
      border: "#c4b5fd",
      borderHover: "#a78bfa",
      cardBackground: "#ffffff",
      cardShadow: "rgba(124, 58, 237, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(124, 58, 237, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#ede9fe",
      dropdownItemFocus: "#ddd6fe",
      dropdownShadow: "rgba(124, 58, 237, 0.1)",
      sidebarBackground: "#ede9fe",
      sidebarItemHover: "#ddd6fe",
      sidebarItemFocus: "#c4b5fd",
      buttonBg: "#7c3aed",
      buttonBgHover: "#6d28d9",
      buttonText: "#ffffff",
      buttonBorder: "#6d28d9",
      buttonBorderHover: "#5b21b6",
      buttonSecondBg: "#ede9fe",
      buttonSecondBgHover: "#ddd6fe",
      bookmarkItemBg: "#ede9fe",
      bookmarkItemText: "#581c87",
      drawerBackground: "#ffffff",
    },
    {
      name: "Orange Light",
      primary: "#ea580c",
      background: "#fff7ed",
      textPrimary: "#9a3412",
      textSecondary: "#c2410c",
      border: "#fed7aa",
      borderHover: "#fdba74",
      cardBackground: "#ffffff",
      cardShadow: "rgba(234, 88, 12, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(234, 88, 12, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#ffedd5",
      dropdownItemFocus: "#fed7aa",
      dropdownShadow: "rgba(234, 88, 12, 0.1)",
      sidebarBackground: "#ffedd5",
      sidebarItemHover: "#fed7aa",
      sidebarItemFocus: "#fdba74",
      buttonBg: "#ea580c",
      buttonBgHover: "#dc2626",
      buttonText: "#ffffff",
      buttonBorder: "#dc2626",
      buttonBorderHover: "#b91c1c",
      buttonSecondBg: "#ffedd5",
      buttonSecondBgHover: "#fed7aa",
      bookmarkItemBg: "#ffedd5",
      bookmarkItemText: "#9a3412",
      drawerBackground: "#ffffff",
    },
    {
      name: "Teal Light",
      primary: "#0d9488",
      background: "#f0fdfa",
      textPrimary: "#134e4a",
      textSecondary: "#0f766e",
      border: "#99f6e4",
      borderHover: "#5eead4",
      cardBackground: "#ffffff",
      cardShadow: "rgba(13, 148, 136, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(13, 148, 136, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#ccfbf1",
      dropdownItemFocus: "#99f6e4",
      dropdownShadow: "rgba(13, 148, 136, 0.1)",
      sidebarBackground: "#ccfbf1",
      sidebarItemHover: "#99f6e4",
      sidebarItemFocus: "#5eead4",
      buttonBg: "#0d9488",
      buttonBgHover: "#0f766e",
      buttonText: "#ffffff",
      buttonBorder: "#0f766e",
      buttonBorderHover: "#134e4a",
      buttonSecondBg: "#ccfbf1",
      buttonSecondBgHover: "#99f6e4",
      bookmarkItemBg: "#ccfbf1",
      bookmarkItemText: "#134e4a",
      drawerBackground: "#ffffff",
    },
    {
      name: "Pink Light",
      primary: "#db2777",
      background: "#fdf2f8",
      textPrimary: "#831843",
      textSecondary: "#be185d",
      border: "#f3e8ff",
      borderHover: "#e879f9",
      cardBackground: "#ffffff",
      cardShadow: "rgba(219, 39, 119, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(219, 39, 119, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#fce7f3",
      dropdownItemFocus: "#fbcfe8",
      dropdownShadow: "rgba(219, 39, 119, 0.1)",
      sidebarBackground: "#fce7f3",
      sidebarItemHover: "#fbcfe8",
      sidebarItemFocus: "#f9a8d4",
      buttonBg: "#db2777",
      buttonBgHover: "#be185d",
      buttonText: "#ffffff",
      buttonBorder: "#be185d",
      buttonBorderHover: "#9d174d",
      buttonSecondBg: "#fce7f3",
      buttonSecondBgHover: "#fbcfe8",
      bookmarkItemBg: "#fce7f3",
      bookmarkItemText: "#831843",
      drawerBackground: "#ffffff",
    },
    {
      name: "Indigo Light",
      primary: "#4f46e5",
      background: "#eef2ff",
      textPrimary: "#3730a3",
      textSecondary: "#4338ca",
      border: "#c7d2fe",
      borderHover: "#a5b4fc",
      cardBackground: "#ffffff",
      cardShadow: "rgba(79, 70, 229, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(79, 70, 229, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#e0e7ff",
      dropdownItemFocus: "#c7d2fe",
      dropdownShadow: "rgba(79, 70, 229, 0.1)",
      sidebarBackground: "#e0e7ff",
      sidebarItemHover: "#c7d2fe",
      sidebarItemFocus: "#a5b4fc",
      buttonBg: "#4f46e5",
      buttonBgHover: "#4338ca",
      buttonText: "#ffffff",
      buttonBorder: "#4338ca",
      buttonBorderHover: "#3730a3",
      buttonSecondBg: "#e0e7ff",
      buttonSecondBgHover: "#c7d2fe",
      bookmarkItemBg: "#e0e7ff",
      bookmarkItemText: "#3730a3",
      drawerBackground: "#ffffff",
    },
    {
      name: "Cyan Light",
      primary: "#0891b2",
      background: "#ecfeff",
      textPrimary: "#164e63",
      textSecondary: "#0e7490",
      border: "#a5f3fc",
      borderHover: "#67e8f9",
      cardBackground: "#ffffff",
      cardShadow: "rgba(8, 145, 178, 0.1)",
      inputBackground: "#ffffff",
      dialogBackground: "#ffffff",
      dialogShadow: "rgba(8, 145, 178, 0.15)",
      dropdownBackground: "#ffffff",
      dropdownItemHover: "#cffafe",
      dropdownItemFocus: "#a5f3fc",
      dropdownShadow: "rgba(8, 145, 178, 0.1)",
      sidebarBackground: "#cffafe",
      sidebarItemHover: "#a5f3fc",
      sidebarItemFocus: "#67e8f9",
      buttonBg: "#0891b2",
      buttonBgHover: "#0e7490",
      buttonText: "#ffffff",
      buttonBorder: "#0e7490",
      buttonBorderHover: "#155e75",
      buttonSecondBg: "#cffafe",
      buttonSecondBgHover: "#a5f3fc",
      bookmarkItemBg: "#cffafe",
      bookmarkItemText: "#164e63",
      drawerBackground: "#ffffff",
    },
  ],
  dark: [
    {
      name: "Default Dark",
      primary: "#3686ff",
      background: "#0a0a0a",
      textPrimary: "#ececec",
      textSecondary: "#a8a8a8",
      border: "#353535",
      borderHover: "#418dfe",
      cardBackground: "#242424",
      cardShadow: "rgba(0, 0, 0, 0.3)",
      inputBackground: "#1e1e1e",
      dialogBackground: "#1e1e1e",
      dialogShadow: "rgba(0, 0, 0, 0.5)",
      dropdownBackground: "#1e1e1e",
      dropdownItemHover: "#2d2d2d",
      dropdownItemFocus: "#404040",
      dropdownShadow: "rgba(0, 0, 0, 0.5)",
      sidebarBackground: "#131313",
      sidebarItemHover: "#1e1e1e",
      sidebarItemFocus: "#333333",
      buttonBg: "#3686ff",
      buttonBgHover: "#418dfe",
      buttonText: "#ffffff",
      buttonBorder: "#418dfe",
      buttonBorderHover: "#5aa3ff",
      buttonSecondBg: "#1e1e1e",
      buttonSecondBgHover: "#343434",
      bookmarkItemBg: "#1e293b",
      bookmarkItemText: "#e2e8f0",
      drawerBackground: "#1e1e1e",
    },
    {
      name: "Deep Purple",
      primary: "#8b5cf6",
      background: "#0f172a",
      textPrimary: "#e2e8f0",
      textSecondary: "#94a3b8",
      border: "#4c1d95",
      borderHover: "#7c3aed",
      cardBackground: "#1e293b",
      cardShadow: "rgba(139, 92, 246, 0.2)",
      inputBackground: "#334155",
      dialogBackground: "#1e293b",
      dialogShadow: "rgba(139, 92, 246, 0.3)",
      dropdownBackground: "#334155",
      dropdownItemHover: "#475569",
      dropdownItemFocus: "#64748b",
      dropdownShadow: "rgba(139, 92, 246, 0.3)",
      sidebarBackground: "#1a1b3a",
      sidebarItemHover: "#312e81",
      sidebarItemFocus: "#4c1d95",
      buttonBg: "#8b5cf6",
      buttonBgHover: "#7c3aed",
      buttonText: "#ffffff",
      buttonBorder: "#7c3aed",
      buttonBorderHover: "#6d28d9",
      buttonSecondBg: "#334155",
      buttonSecondBgHover: "#475569",
      bookmarkItemBg: "#312e81",
      bookmarkItemText: "#e2e8f0",
      drawerBackground: "#1e293b",
    },
    {
      name: "Amber Dark",
      primary: "#f59e0b",
      background: "#1c1917",
      textPrimary: "#fbbf24",
      textSecondary: "#d97706",
      border: "#78350f",
      borderHover: "#f59e0b",
      cardBackground: "#292524",
      cardShadow: "rgba(245, 158, 11, 0.2)",
      inputBackground: "#44403c",
      dialogBackground: "#292524",
      dialogShadow: "rgba(245, 158, 11, 0.3)",
      dropdownBackground: "#44403c",
      dropdownItemHover: "#57534e",
      dropdownItemFocus: "#78716c",
      dropdownShadow: "rgba(245, 158, 11, 0.3)",
      sidebarBackground: "#2a211d",
      sidebarItemHover: "#44403c",
      sidebarItemFocus: "#57534e",
      buttonBg: "#f59e0b",
      buttonBgHover: "#d97706",
      buttonText: "#1c1917",
      buttonBorder: "#d97706",
      buttonBorderHover: "#b45309",
      buttonSecondBg: "#44403c",
      buttonSecondBgHover: "#57534e",
      bookmarkItemBg: "#451a03",
      bookmarkItemText: "#fbbf24",
      drawerBackground: "#292524",
    },
    {
      name: "Crimson Dark",
      primary: "#ef4444",
      background: "#0c0a09",
      textPrimary: "#fca5a5",
      textSecondary: "#f87171",
      border: "#7f1d1d",
      borderHover: "#ef4444",
      cardBackground: "#1c1917",
      cardShadow: "rgba(239, 68, 68, 0.2)",
      inputBackground: "#44403c",
      dialogBackground: "#1c1917",
      dialogShadow: "rgba(239, 68, 68, 0.3)",
      dropdownBackground: "#44403c",
      dropdownItemHover: "#57534e",
      dropdownItemFocus: "#78716c",
      dropdownShadow: "rgba(239, 68, 68, 0.3)",
      sidebarBackground: "#2b1a1a",
      sidebarItemHover: "#44403c",
      sidebarItemFocus: "#57534e",
      buttonBg: "#ef4444",
      buttonBgHover: "#dc2626",
      buttonText: "#ffffff",
      buttonBorder: "#dc2626",
      buttonBorderHover: "#b91c1c",
      buttonSecondBg: "#44403c",
      buttonSecondBgHover: "#57534e",
      bookmarkItemBg: "#7f1d1d",
      bookmarkItemText: "#fca5a5",
      drawerBackground: "#1c1917",
    },
    {
      name: "Emerald Dark",
      primary: "#10b981",
      background: "#0f1419",
      textPrimary: "#6ee7b7",
      textSecondary: "#34d399",
      border: "#064e3b",
      borderHover: "#10b981",
      cardBackground: "#1f2937",
      cardShadow: "rgba(16, 185, 129, 0.2)",
      inputBackground: "#374151",
      dialogBackground: "#1f2937",
      dialogShadow: "rgba(16, 185, 129, 0.3)",
      dropdownBackground: "#374151",
      dropdownItemHover: "#4b5563",
      dropdownItemFocus: "#6b7280",
      dropdownShadow: "rgba(16, 185, 129, 0.3)",
      sidebarBackground: "#12231d",
      sidebarItemHover: "#1f2937",
      sidebarItemFocus: "#374151",
      buttonBg: "#10b981",
      buttonBgHover: "#059669",
      buttonText: "#ffffff",
      buttonBorder: "#059669",
      buttonBorderHover: "#047857",
      buttonSecondBg: "#374151",
      buttonSecondBgHover: "#4b5563",
      bookmarkItemBg: "#064e3b",
      bookmarkItemText: "#6ee7b7",
      drawerBackground: "#1f2937",
    },
    {
      name: "Ocean Dark",
      primary: "#06b6d4",
      background: "#082f49",
      textPrimary: "#67e8f9",
      textSecondary: "#22d3ee",
      border: "#164e63",
      borderHover: "#06b6d4",
      cardBackground: "#0c4a6e",
      cardShadow: "rgba(6, 182, 212, 0.2)",
      inputBackground: "#155e75",
      dialogBackground: "#0c4a6e",
      dialogShadow: "rgba(6, 182, 212, 0.3)",
      dropdownBackground: "#155e75",
      dropdownItemHover: "#0e7490",
      dropdownItemFocus: "#0891b2",
      dropdownShadow: "rgba(6, 182, 212, 0.3)",
      sidebarBackground: "#063c57",
      sidebarItemHover: "#0c4a6e",
      sidebarItemFocus: "#155e75",
      buttonBg: "#06b6d4",
      buttonBgHover: "#0891b2",
      buttonText: "#ffffff",
      buttonBorder: "#0891b2",
      buttonBorderHover: "#0e7490",
      buttonSecondBg: "#155e75",
      buttonSecondBgHover: "#0e7490",
      bookmarkItemBg: "#164e63",
      bookmarkItemText: "#67e8f9",
      drawerBackground: "#0c4a6e",
    },
    {
      name: "Forest Dark",
      primary: "#22c55e",
      background: "#0f172a",
      textPrimary: "#86efac",
      textSecondary: "#4ade80",
      border: "#15803d",
      borderHover: "#22c55e",
      cardBackground: "#1e293b",
      cardShadow: "rgba(34, 197, 94, 0.2)",
      inputBackground: "#334155",
      dialogBackground: "#1e293b",
      dialogShadow: "rgba(34, 197, 94, 0.3)",
      dropdownBackground: "#334155",
      dropdownItemHover: "#475569",
      dropdownItemFocus: "#64748b",
      dropdownShadow: "rgba(34, 197, 94, 0.3)",
      sidebarBackground: "#122a1b",
      sidebarItemHover: "#1e293b",
      sidebarItemFocus: "#334155",
      buttonBg: "#22c55e",
      buttonBgHover: "#16a34a",
      buttonText: "#ffffff",
      buttonBorder: "#16a34a",
      buttonBorderHover: "#15803d",
      buttonSecondBg: "#334155",
      buttonSecondBgHover: "#475569",
      bookmarkItemBg: "#15803d",
      bookmarkItemText: "#86efac",
      drawerBackground: "#1e293b",
    },
    {
      name: "Sunset Dark",
      primary: "#f97316",
      background: "#1a202c",
      textPrimary: "#fdba74",
      textSecondary: "#fb923c",
      border: "#9a3412",
      borderHover: "#f97316",
      cardBackground: "#2d3748",
      cardShadow: "rgba(249, 115, 22, 0.2)",
      inputBackground: "#4a5568",
      dialogBackground: "#2d3748",
      dialogShadow: "rgba(249, 115, 22, 0.3)",
      dropdownBackground: "#4a5568",
      dropdownItemHover: "#718096",
      dropdownItemFocus: "#a0aec0",
      dropdownShadow: "rgba(249, 115, 22, 0.3)",
      sidebarBackground: "#32261e",
      sidebarItemHover: "#2d3748",
      sidebarItemFocus: "#4a5568",
      buttonBg: "#f97316",
      buttonBgHover: "#ea580c",
      buttonText: "#ffffff",
      buttonBorder: "#ea580c",
      buttonBorderHover: "#c2410c",
      buttonSecondBg: "#4a5568",
      buttonSecondBgHover: "#718096",
      bookmarkItemBg: "#9a3412",
      bookmarkItemText: "#fdba74",
      drawerBackground: "#2d3748",
    },
    {
      name: "Lavender Dark",
      primary: "#a855f7",
      background: "#1e1b4b",
      textPrimary: "#c4b5fd",
      textSecondary: "#a78bfa",
      border: "#581c87",
      borderHover: "#a855f7",
      cardBackground: "#312e81",
      cardShadow: "rgba(168, 85, 247, 0.2)",
      inputBackground: "#4338ca",
      dialogBackground: "#312e81",
      dialogShadow: "rgba(168, 85, 247, 0.3)",
      dropdownBackground: "#4338ca",
      dropdownItemHover: "#4f46e5",
      dropdownItemFocus: "#6366f1",
      dropdownShadow: "rgba(168, 85, 247, 0.3)",
      sidebarBackground: "#27235a",
      sidebarItemHover: "#312e81",
      sidebarItemFocus: "#4338ca",
      buttonBg: "#a855f7",
      buttonBgHover: "#9333ea",
      buttonText: "#ffffff",
      buttonBorder: "#9333ea",
      buttonBorderHover: "#7c3aed",
      buttonSecondBg: "#4338ca",
      buttonSecondBgHover: "#4f46e5",
      bookmarkItemBg: "#581c87",
      bookmarkItemText: "#c4b5fd",
      drawerBackground: "#312e81",
    },
    {
      name: "Midnight Dark",
      primary: "#6366f1",
      background: "#020617",
      textPrimary: "#e2e8f0",
      textSecondary: "#94a3b8",
      border: "#1e293b",
      borderHover: "#6366f1",
      cardBackground: "#0f172a",
      cardShadow: "rgba(99, 102, 241, 0.2)",
      inputBackground: "#1e293b",
      dialogBackground: "#0f172a",
      dialogShadow: "rgba(99, 102, 241, 0.3)",
      dropdownBackground: "#1e293b",
      dropdownItemHover: "#334155",
      dropdownItemFocus: "#475569",
      dropdownShadow: "rgba(99, 102, 241, 0.3)",
      sidebarBackground: "#0b0e2a",
      sidebarItemHover: "#0f172a",
      sidebarItemFocus: "#1e293b",
      buttonBg: "#6366f1",
      buttonBgHover: "#4f46e5",
      buttonText: "#ffffff",
      buttonBorder: "#4f46e5",
      buttonBorderHover: "#4338ca",
      buttonSecondBg: "#1e293b",
      buttonSecondBgHover: "#334155",
      bookmarkItemBg: "#1e293b",
      bookmarkItemText: "#e2e8f0",
      drawerBackground: "#0f172a",
    },
  ],
};

const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    setBackgroundImage,
    backgroundImage,
    colorSettings,
    setColorSettings,
  } = useTheme();

  const [imageSettings, setImageSettings] = useState({
    blur: 2,
    opacity: 0.2,
  });

  // Apply image settings to CSS variables
  useEffect(() => {
    if (theme === "image" && backgroundImage) {
      document.documentElement.style.setProperty(
        "--background",
        `linear-gradient(rgba(0, 0, 0, 0), url(${backgroundImage}))`
      );
      document.documentElement.style.setProperty(
        "--bg-blur",
        `${imageSettings.blur}px`
      );
      document.documentElement.style.setProperty(
        "--overlay-opacity",
        `${imageSettings.opacity}`
      );
    }
  }, [theme, backgroundImage, imageSettings]);

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
    value: number
  ) => {
    setImageSettings((prev) => ({ ...prev, [field]: value }));
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
    };

    // Apply all CSS variables
    Object.entries(preset).forEach(([key, value]) => {
      const cssVar = cssVarMap[key as keyof typeof cssVarMap];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value as string);
      }
    });

    // Also update colorSettings for compatibility
    setColorSettings({
      primary: preset.primary,
      background: preset.background,
      cardBackground: preset.cardBackground,
      sidebar: preset.sidebarBackground,
    });
  };

  const renderThemeSelector = () => (
    <div className="theme-selector mb-6">
      <h3 className="text-lg font-semibold mb-4">Select Theme Mode</h3>
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
          onClick={() => setTheme("image")}
        >
          <div className="w-full h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded mb-2"></div>
          <span>Image</span>
        </button>
      </div>
    </div>
  );

  const renderPresetThemes = (themeType: "light" | "dark") => (
    <div className="preset-themes mb-6">
      <h3 className="text-lg font-semibold mb-4">Preset Themes</h3>
      <div className="grid grid-cols-2 gap-4">
        {PRESET_THEMES[themeType].map((preset, index) => (
          <button
            key={index}
            className={`p-4 rounded-lg border transition-all ${
              colorSettings.primary === preset.primary &&
              colorSettings.background === preset.background &&
              colorSettings.cardBackground === preset.cardBackground
                ? "border-primary ring-2 ring-primary"
                : "border-gray-200"
            }`}
            onClick={() => applyPresetTheme(preset)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: preset.primary }}
              ></div>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: preset.background }}
              ></div>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: preset.cardBackground }}
              ></div>
            </div>
            <span className="mt-2 block text-sm">{preset.name}</span>
          </button>
        ))}
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
      overlayClassName="z-[1500]"
      overlayOpacity={0.2}
    >
      <div className="h-full flex flex-col bg-drawer-background">
        <div className="p-6 border-b">
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
        <div className="p-4 border-t flex justify-end gap-2">
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
