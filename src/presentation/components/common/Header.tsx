import React, { useState } from "react";
import ThemeSelector from "./ThemeSelector";

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="main-header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="header-top flex items-center justify-between">
        <h2 className="header-title text-xl font-bold text-gray-800 dark:text-white">
          FlexBookmark
        </h2>

        <div className="header-actions flex items-center gap-4">
          <div className="search-box relative flex-1 max-w-md">
            <span className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              className="search-input w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
