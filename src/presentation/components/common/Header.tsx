import React, { useState } from "react";
import ThemeSelector from "./ThemeSelector";

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // TODO: implement search functionality
  };

  return (
    <header className="main-header bg-background-primary border-b border-border-primary p-4">
      <div className="header-top flex items-center justify-between">
        <div className="header-actions flex items-center gap-4">
          <div className="search-box relative flex-1 max-w-md">
            <span className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2">
              🔍
            </span>
            <input
              type="text"
              className="search-input w-full pl-10 pr-4 py-2 rounded-lg border border-border-primary bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="header-buttons flex items-center gap-2">
            <ThemeSelector />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
