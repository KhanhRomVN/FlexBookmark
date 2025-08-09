import React, { useState } from "react";
import { EllipsisVertical as LucideMenu } from "lucide-react";

interface BookmarkCardProps {
  item: any;
  depth: number;
  isDropTarget: boolean;
  onDropTargetChange: (id: string | null) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  item,
  depth,
  isDropTarget,
  onDropTargetChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // drag+drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDropTargetChange(item.id);
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDropTargetChange(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.id === item.id) return;
      await chrome.bookmarks.move(data.id, {
        parentId: item.parentId || "",
        index: data.index,
      });
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  const handleClick = () => {
    chrome.tabs.create({ url: item.url });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      className={`bookmark-card group flex items-center p-2 rounded-md transition-all
        ${depth > 1 ? "ml-4" : ""}
        ${
          isDropTarget
            ? "bg-blue-100 dark:bg-blue-900 border border-primary"
            : ""
        }
      `}
      onClick={handleClick}
      draggable
      onDragOver={handleDragOver}
      onDragLeave={() => onDropTargetChange(null)}
      onDrop={handleDrop}
    >
      <img
        src={`https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}`}
        alt="Favicon"
        className="w-5 h-5 mr-3"
      />

      <div className="flex-1 min-w-0">
        <div className="bookmark-title truncate text-sm font-medium">
          {item.title}
        </div>
      </div>

      <div className="relative">
        <button
          className="bookmark-menu-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 invisible group-hover:visible"
          onClick={handleMenuClick}
        >
          <LucideMenu size={16} />
        </button>

        {showMenu && (
          <div className="menu-dropdown absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              ✏️ Edit
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;
