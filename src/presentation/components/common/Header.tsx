import React from "react";
import ThemeSelector from "./ThemeSelector";
import { useSearchStore } from "../../store/searchStore";

const Header: React.FC = () => {
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="main-header bg-sidebar-background border-b border-border-default h-12">
      <div className="header-top flex items-center justify-between h-full">
        <div className="search-box relative h-full w-[70%]">
          <span className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2">
            🔍
          </span>
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
