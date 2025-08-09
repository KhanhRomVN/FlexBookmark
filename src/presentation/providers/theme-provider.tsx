import { createContext, useContext, useEffect, useState, useRef } from "react";

type Theme = "dark" | "light" | "system" | "image";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setBackgroundImage: (url: string) => void;
  backgroundImage: string | null;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  setBackgroundImage: () => null,
  backgroundImage: null,
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

  const bgImageRef = useRef<string | null>(null);

  const applyTheme = () => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "image");

    if (theme === "image") {
      root.classList.add("image");
      if (bgImageRef.current) {
        document.body.style.backgroundImage = `url(${bgImageRef.current})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
      }
    } else {
      document.body.style.backgroundImage = "";
      const systemTheme =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.classList.add(systemTheme);
    }
  };

  const setBackgroundImage = (url: string) => {
    bgImageRef.current = url;
    localStorage.setItem("backgroundImage", url);
    if (theme === "image") {
      applyTheme();
    }
  };

  useEffect(() => {
    const storedBgImage = localStorage.getItem("backgroundImage");
    if (storedBgImage) {
      bgImageRef.current = storedBgImage;
    }

    applyTheme();
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    setBackgroundImage,
    backgroundImage: bgImageRef.current,
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
