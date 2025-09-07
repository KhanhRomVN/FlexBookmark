import React, { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { EllipsisVertical as LucideMenu } from "lucide-react";

export interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
}

interface BookmarkCardProps {
  item: BookmarkItem;
  parentId: string;
  depth: number;
  isDragging?: boolean;
  hideWhenDragging?: boolean;
  disableDrag?: boolean;
  onBookmarkMoved?: (
    bookmarkId: string,
    fromParentId: string,
    toParentId: string
  ) => void;
  onDrop?: (item: any) => void;
  onEdit?: (item: BookmarkItem & { parentId: string }) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  item,
  parentId,
  depth,
  isDragging = false,
  hideWhenDragging = false,
  disableDrag = false,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    disabled: disableDrag,
    data: {
      type: "bookmark",
      payload: { ...item, parentId },
    },
  });

  const style: CSSProperties = {
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.({ ...item, parentId });
    setShowMenu(false);
  };

  // close dropdown when clicking outside
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete bookmark "${item.title}"?`)) return;
    try {
      await new Promise((res, rej) =>
        chrome.bookmarks.remove(item.id, () => {
          if (chrome.runtime.lastError) rej(chrome.runtime.lastError);
          else res(true);
        })
      );
    } catch (err) {
      console.error("[BookmarkCard] delete fail", err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center p-2 rounded-md transition-all ${
        depth > 1 ? "ml-4" : ""
      } cursor-grab ${hideWhenDragging ? "invisible" : ""}`}
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

      <div ref={containerRef} className="relative">
        <button
          className={`bookmark-menu-btn p-1 rounded bg-button-secondBg text-text-secondary hover:bg-button-secondBgHover focus:outline-none transition-opacity ${
            isHovered || showMenu ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleMenuClick}
          aria-label="Open menu"
        >
          <LucideMenu size={16} />
        </button>

        {showMenu && (
          <div
            className="menu-dropdown absolute right-0 top-full mt-1 w-32 rounded-md shadow z-10 backdrop-blur-sm
            bg-dropdown-background border border-border-default "
          >
            <button
              className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover focus:bg-dropdown-itemFocus transition-colors"
              onClick={handleEdit}
            >
              ✏️ Edit
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover focus:bg-dropdown-itemFocus text-red-500 transition-colors"
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
