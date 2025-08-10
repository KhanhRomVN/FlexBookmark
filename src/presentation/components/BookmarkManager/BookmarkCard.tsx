import React, { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { EllipsisVertical as LucideMenu } from "lucide-react";

interface BookmarkCardProps {
  item: any;
  parentId: string;
  depth: number;
  isDragging?: boolean;
  onBookmarkMoved?: (
    bookmarkId: string,
    fromParentId: string,
    toParentId: string
  ) => void;
  onDrop?: (item: any) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  item,
  parentId,
  depth,
  isDragging = false,
  onBookmarkMoved,
  onDrop,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
  } = useDraggable({
    id: item.id,
    data: {
      type: "bookmark",
      item,
      parentId,
    },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `bookmark-drop-${item.id}`,
    data: { accepts: ["bookmark"] },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const handleClick = () => {
    chrome.tabs.create({ url: item.url });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Handle delete bookmark
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chrome.bookmarks.remove(item.id);
      if (onBookmarkMoved) {
        onBookmarkMoved(item.id, parentId, "");
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      {...attributes}
      {...listeners}
      className={`bookmark-card group flex items-center p-2 rounded-md transition-all
        ${depth > 1 ? "ml-4" : ""}
        ${isOver ? "bg-blue-100 dark:bg-blue-900 border border-primary" : ""}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsOver(true)}
      onMouseLeave={() => setIsOver(false)}
    >
      {item.url && (
        <img
          src={`https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}`}
          alt="Favicon"
          className="w-5 h-5 mr-3"
        />
      )}

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
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
              onClick={handleDelete}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;
