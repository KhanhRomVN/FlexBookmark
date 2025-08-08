import React, { useState } from "react";

interface BookmarkCardProps {
  item: any;
  depth: number;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ item, depth }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    chrome.tabs.create({ url: item.url });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      className={`bookmark-card flex items-center p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        depth > 0 ? "ml-4" : ""
      }`}
      onClick={handleClick}
    >
      <img
        src={`https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}`}
        alt="Favicon"
        className="w-5 h-5 mr-3"
      />

      <div className="flex-1 min-w-0">
        <div className="bookmark-title truncate text-gray-800 dark:text-gray-200">
          {item.title}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {new URL(item.url).hostname}
        </div>
      </div>

      <div className="relative">
        <button
          className="bookmark-menu-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={handleMenuClick}
        >
          ⋮
        </button>

        {showMenu && (
          <div className="menu-dropdown absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              Edit
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;
