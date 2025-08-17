import { createContext, useContext, useEffect, useState } from "react";
import defaultBgImage from "../../assets/background_images/ocean_beach_aerial_view_134429_1920x1080.jpg";
import { PRESET_THEMES } from "../components/drawer/PresetTheme";

type Theme = "dark" | "light" | "system" | "image";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ColorSettings = {
  primary: string;
  background: string;
  cardBackground: string;
  sidebar: string;
};
type ImageThemeSettings = {
  blur: number;
  brightness: number;
  overlay: string;
  clockGradientFrom: string;
  clockGradientTo: string;
  inputBackground: string;
  sidebarOpacity: number;
  cardOpacity: number;
  overlayOpacity: number;
  inputOpacity: number;
  dialogOpacity: number;
  bmBlur: number;
  bmOverlayOpacity: number;
  bmSidebarOpacity: number;
  bmCardOpacity: number;
  bmCardBlur: number;
  bmDialogOpacity: number;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setBackgroundImage: (url: string) => void;
  backgroundImage: string | null;
  backgroundImages: string[];
  setBackgroundImages: (images: string[]) => void;
  removeBackgroundImage: (url: string) => void;
  colorSettings: ColorSettings;
  setColorSettings: (settings: ColorSettings) => void;
  imageThemeSettings: ImageThemeSettings;
  setImageThemeSettings: (settings: ImageThemeSettings) => void;
};
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  setBackgroundImage: () => null,
  backgroundImage: null,
  backgroundImages: [],
  setBackgroundImages: () => {},
  removeBackgroundImage: () => {},
  colorSettings: {
    primary: "#3686ff",
    background: "#ffffff",
    cardBackground: "#ffffff",
    sidebar: "#f9fafb",
  },
  setColorSettings: () => {},
  imageThemeSettings: {
    blur: 8,
    brightness: 100,
    overlay: "rgba(0,0,0,0.1)",
    clockGradientFrom: "#ffffff",
    clockGradientTo: "#ffffff",
    inputBackground: "rgba(0,0,0,0.3)",
    sidebarOpacity: 0.3,
    cardOpacity: 0.3,
    overlayOpacity: 10,
    inputOpacity: 30,
    dialogOpacity: 20,
    bmBlur: 5,
    bmOverlayOpacity: 15,
    bmSidebarOpacity: 20,
    bmCardOpacity: 15,
    bmCardBlur: 3,
    bmDialogOpacity: 10,
  },
  setImageThemeSettings: () => {},
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [bgImage, setBgImage] = useState<string>(
    () => localStorage.getItem("backgroundImage") || defaultBgImage
  );

  const [bgImages, setBgImages] = useState<string[]>(() =>
    JSON.parse(
      localStorage.getItem("backgroundImages") ||
        JSON.stringify([defaultBgImage])
    )
  );

  // Persisted color settings for light/dark themes
  const [colorSettings, setColorSettings] = useState<ColorSettings>(() => {
    const saved = localStorage.getItem(`${storageKey}-colors`);
    if (saved) {
      return JSON.parse(saved);
    }
    // default fallback based on defaultTheme
    let defaultColors: ColorSettings;
    if (defaultTheme === "dark") {
      // use Midnight Dark preset by name
      const midnight = PRESET_THEMES.dark.find(
        (t) => t.name === "Midnight Dark"
      );
      defaultColors = midnight
        ? {
            primary: midnight.primary,
            background: midnight.background,
            cardBackground: midnight.cardBackground,
            sidebar: midnight.sidebarBackground || midnight.cardBackground,
          }
        : {
            primary: "#3686ff",
            background: "#ffffff",
            cardBackground: "#ffffff",
            sidebar: "#f9fafb",
          };
    } else {
      defaultColors = {
        primary: "#3686ff",
        background: "#ffffff",
        cardBackground: "#ffffff",
        sidebar: "#f9fafb",
      };
    }
    return defaultColors;
  });

  const updateColorSettings = (settings: ColorSettings) => {
    setColorSettings(settings);
    localStorage.setItem(`${storageKey}-colors`, JSON.stringify(settings));
  };

  const [imageThemeSettings, setImageThemeSettings] =
    useState<ImageThemeSettings>(() => {
      const saved = localStorage.getItem(`${storageKey}-image-settings`);
      return saved
        ? JSON.parse(saved)
        : {
            blur: 8,
            brightness: 100,
            overlay: "rgba(0,0,0,0.1)",
            clockGradientFrom: "#ffffff",
            clockGradientTo: "#ffffff",
            inputBackground: "rgba(0,0,0,0.3)",
            sidebarOpacity: 0.3,
            cardOpacity: 0.3,
            overlayOpacity: 10,
            inputOpacity: 30,
            dialogOpacity: 20,
            bmBlur: 5,
            bmOverlayOpacity: 15,
            bmSidebarOpacity: 20,
            bmCardOpacity: 15,
            bmCardBlur: 3,
            bmDialogOpacity: 10,
          };
    });

  const updateImageThemeSettings = (settings: ImageThemeSettings) => {
    setImageThemeSettings(settings);
    localStorage.setItem(
      `${storageKey}-image-settings`,
      JSON.stringify(settings)
    );
  };

  // Manage multiple background images (from device or URL)
  const setBackgroundImages = (images: string[]) => {
    setBgImages(images);
    localStorage.setItem("backgroundImages", JSON.stringify(images));
  };
  const removeBackgroundImage = (url: string) => {
    const newList = bgImages.filter((img) => img !== url);
    setBackgroundImages(newList);
    if (url === bgImage) {
      const newSelected = newList[0] || defaultBgImage;
      setBackgroundImage(newSelected);
    }
  };
  const applyTheme = () => {
    const root = window.document.documentElement;
    // clear classes
    root.classList.remove("light", "dark", "image");
    // clear all inline CSS variables
    Array.from(root.style)
      .filter((prop) => prop.startsWith("--"))
      .forEach((prop) => root.style.removeProperty(prop));

    const effectiveTheme: Theme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    if (theme === "image") {
      root.classList.add("image");
      if (bgImage) {
        // store image url in CSS var for blur overlay
        root.style.setProperty("--bg-url", `url(${bgImage})`);
        root.style.setProperty("--bg-blur", `${imageThemeSettings.blur}px`);
        root.style.setProperty(
          "--bg-brightness",
          `${imageThemeSettings.brightness}%`
        );
        root.style.setProperty(
          "--overlay-color",
          `rgba(0, 0, 0, ${imageThemeSettings.overlayOpacity / 100})`
        );
        // clock gradient for image theme
        root.style.setProperty(
          "--clock-gradient-from",
          imageThemeSettings.clockGradientFrom
        );
        root.style.setProperty(
          "--clock-gradient-to",
          imageThemeSettings.clockGradientTo
        );
        // provide backwards-compatible --clock-color gradient
        root.style.setProperty(
          "--clock-color",
          `linear-gradient(to right, ${imageThemeSettings.clockGradientFrom}, ${imageThemeSettings.clockGradientTo})`
        );
        root.style.setProperty(
          "--input-background",
          `rgba(0,0,0,${imageThemeSettings.inputOpacity / 100})`
        );
        root.style.setProperty(
          "--sidebar-opacity",
          imageThemeSettings.sidebarOpacity.toString()
        );
        // Dialog background transparency for image theme
        root.style.setProperty(
          "--card-opacity",
          imageThemeSettings.cardOpacity.toString()
        );
      }
    } else {
      root.classList.add(effectiveTheme);
    }

    // apply color variables for light/dark
    if (effectiveTheme === "light" || effectiveTheme === "dark") {
      Object.entries(colorSettings).forEach(([key, value]) => {
        // convert camelCase key to kebab-case CSS variable
        const varName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        root.style.setProperty(varName, value as string);
      });
      // apply clock gradient from preset for palette themes
      const palettePresets = PRESET_THEMES[effectiveTheme];
      const matched = palettePresets.find(
        (p) =>
          p.primary === colorSettings.primary &&
          p.background === colorSettings.background &&
          p.cardBackground === colorSettings.cardBackground
      );
      if (matched?.clockGradientFrom && matched?.clockGradientTo) {
        root.style.setProperty(
          "--clock-gradient-from",
          matched.clockGradientFrom
        );
        root.style.setProperty("--clock-gradient-to", matched.clockGradientTo);
      }
    }
  };

  const setBackgroundImage = (url: string) => {
    setBgImage(url);
    setBackgroundImages(bgImages.includes(url) ? bgImages : [...bgImages, url]);
    localStorage.setItem("backgroundImage", url);
    if (theme === "image") {
      applyTheme();
    }
  };

  useEffect(() => {
    applyTheme();
  }, [theme, bgImage, colorSettings, imageThemeSettings]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    setBackgroundImage,
    backgroundImage: bgImage,
    backgroundImages: bgImages,
    setBackgroundImages,
    removeBackgroundImage,
    colorSettings,
    setColorSettings: updateColorSettings,
    imageThemeSettings,
    setImageThemeSettings: updateImageThemeSettings,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
