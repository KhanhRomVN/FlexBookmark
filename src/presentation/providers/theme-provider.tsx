import { createContext, useContext, useEffect, useState } from "react";
import defaultBgImage from "../../assets/background_images/ocean_beach_aerial_view_134429_1920x1080.jpg";

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

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setBackgroundImage: (url: string) => void;
  backgroundImage: string | null;
  colorSettings: ColorSettings;
  setColorSettings: (settings: ColorSettings) => void;
};
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  setBackgroundImage: () => null,
  backgroundImage: null,
  colorSettings: {
    primary: "#3686ff",
    background: "#ffffff",
    cardBackground: "#ffffff",
    sidebar: "#f9fafb",
  },
  setColorSettings: () => {},
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [bgImage, setBgImage] = useState<string>(
    () => localStorage.getItem("backgroundImage") || defaultBgImage
  );

  // Persisted color settings for light/dark themes
  const [colorSettings, setColorSettings] = useState<ColorSettings>(() =>
    JSON.parse(
      localStorage.getItem(`${storageKey}-colors`) ||
        JSON.stringify({
          primary: "#3686ff",
          background: "#ffffff",
          cardBackground: "#ffffff",
          sidebar: "#f9fafb",
        })
    )
  );

  const updateColorSettings = (settings: ColorSettings) => {
    setColorSettings(settings);
    localStorage.setItem(`${storageKey}-colors`, JSON.stringify(settings));
  };

  const applyTheme = () => {
    const root = window.document.documentElement;
    // clear classes & CSS var
    root.classList.remove("light", "dark", "image");
    root.style.setProperty("--bg-url", "");

    if (theme === "image") {
      root.classList.add("image");
      if (bgImage) {
        // store image url in CSS var for blur overlay
        root.style.setProperty("--bg-url", `url(${bgImage})`);
      }
    } else {
      // normal theme: system or explicit light/dark
      const systemTheme =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.classList.add(systemTheme);
    }

    // apply color variables for light/dark
    if (theme === "light" || theme === "dark") {
      Object.entries(colorSettings).forEach(([key, value]) => {
        // convert camelCase key to kebab-case CSS variable
        const varName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        root.style.setProperty(varName, value);
      });
    }
  };

  const setBackgroundImage = (url: string) => {
    setBgImage(url);
    localStorage.setItem("backgroundImage", url);
    if (theme === "image") {
      applyTheme();
    }
  };

  useEffect(() => {
    applyTheme();
  }, [theme, bgImage, colorSettings]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    setBackgroundImage,
    backgroundImage: bgImage,
    colorSettings,
    setColorSettings: updateColorSettings,
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
