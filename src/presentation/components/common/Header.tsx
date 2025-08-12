import React from "react";
import ThemeSelector from "./ThemeSelector";
import { useTheme } from "../../providers/theme-provider";
import { useSearchStore } from "../../store/searchStore";
import { Search } from "lucide-react";

const Header: React.FC = () => {
  const { theme } = useTheme();
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header
      className={`main-header bg-sidebar-background border-b border-border-default h-12 px-2 ${
        theme === "image" ? "backdrop-blur-sm" : ""
      }`}
    >
      <div className="header-top flex items-center justify-between h-full">
        <div className="search-box relative h-full w-[70%]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-primary w-5 h-5" />
          <input
            type="text"
            className="search-input h-full w-full pl-10 pr-4 bg-transparent border-none text-text-primary focus:outline-none"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="header-buttons flex items-center">
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
};

export default Header;
