import React, { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { EllipsisVertical as LucideMenu } from "lucide-react";

interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
}

interface BookmarkCardProps {
  item: BookmarkItem;
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
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: {
      type: "bookmark",
      payload: { ...item, parentId },
    },
  });

  // droppable for bookmark card (for reordering/drop feedback)
  const { setNodeRef: setDropRef, isOver: dropIsOver } = useDroppable({
    id: `bookmark-${item.id}`,
    data: {
      type: "bookmark",
      payload: { ...item, parentId },
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e as any).defaultPrevented) return;
    try {
      if (item.url) chrome.tabs.create({ url: item.url });
    } catch (err) {
      console.warn("[BookmarkCard] open url fail", err);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((v) => !v);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await new Promise((res, rej) =>
        chrome.bookmarks.remove(item.id, () => {
          if (chrome.runtime.lastError) rej(chrome.runtime.lastError);
          else res(true);
        })
      );
      console.log("[BookmarkCard] deleted", item.id);
    } catch (err) {
      console.error("[BookmarkCard] delete fail", err);
    }
  };

  return (
    <div
      ref={(n) => {
        setNodeRef(n);
        setDropRef(n);
      }}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        background: dropIsOver ? "rgba(59, 130, 246, 0.1)" : undefined,
      }}
      className={`bookmark-card group flex items-center p-2 rounded-md transition-all ${
        depth > 1 ? "ml-4" : ""
      } cursor-grab bg-white border border-gray-100`}
      onClick={handleClick}
      draggable
    >
      {item.url && (
        <img
          src={`https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}`}
          alt="favicon"
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
          className="bookmark-menu-btn p-1 rounded hover:bg-gray-200 invisible group-hover:visible"
          onClick={handleMenuClick}
        >
          <LucideMenu size={16} />
        </button>

        {showMenu && (
          <div className="menu-dropdown absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100">
              ✏️ Edit
            </button>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500"
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
