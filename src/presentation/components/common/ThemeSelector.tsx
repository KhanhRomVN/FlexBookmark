import { Palette } from "lucide-react";

export interface ThemeSelectorProps {
  /** Callback to open the theme settings drawer */
  onOpenTheme: () => void;
}

/**
 * ThemeSelector button that triggers opening the theme drawer.
 */
const ThemeSelector = ({ onOpenTheme }: ThemeSelectorProps) => {
  return (
    <button
      type="button"
      aria-label="Open theme settings"
      className="theme-btn w-8 h-8 rounded-full bg-background-secondary hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-primary transition flex items-center justify-center"
      onClick={onOpenTheme}
    >
      <Palette className="w-5 h-5 text-text-primary" />
    </button>
  );
};

export default ThemeSelector;
