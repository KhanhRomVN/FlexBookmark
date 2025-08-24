import React, { useState, useRef, useEffect } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { BookmarkNode } from "../../types/bookmark";

interface BookmarkItemProps {
  bookmark: BookmarkNode;
  onEdit?: (bookmark: BookmarkNode) => void;
  onDelete?: (bookmarkId: string) => void;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  onEdit,
  onDelete,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleDelete = async () => {
    setShowContextMenu(false);
    if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
      try {
        await new Promise<void>((resolve, reject) => {
          chrome.bookmarks.remove(bookmark.id, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
        onDelete?.(bookmark.id);
      } catch (error) {
        console.error("Error deleting bookmark:", error);
      }
    }
  };

  // For edit, we'll need to handle it differently since BookmarkForm only creates
  const handleEditWithPrompt = () => {
    setShowContextMenu(false);
    const newTitle = prompt("Enter new bookmark title:", bookmark.title);
    const newUrl = prompt("Enter new bookmark URL:", bookmark.url || "");

    if (newTitle && newUrl) {
      chrome.bookmarks.update(
        bookmark.id,
        {
          title: newTitle.trim(),
          url: newUrl.trim(),
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Error updating bookmark:", chrome.runtime.lastError);
          } else {
            onEdit?.(bookmark);
          }
        }
      );
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: bookmark.id });

  // Add droppable for folder creation or moving into folders
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: bookmark.id,
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    visibility: isDragging ? "hidden" : "visible",
  };

  // Combine refs
  const combinedRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  return (
    <div
      className={`relative group transition-all ${
        isDragging ? "cursor-grabbing" : ""
      }`}
    >
      <div
        ref={combinedRef}
        style={style}
        {...(showContextMenu ? {} : listeners)}
        {...(showContextMenu ? {} : attributes)}
        className={`w-full focus:outline-none focus:ring-0 transition-all duration-200 ${
          isDragging ? "opacity-0" : ""
        }`}
        onContextMenu={handleContextMenu}
        onMouseDown={(e) => {
          // Prevent drag start when right-clicking
          if (e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }}
      >
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col items-center px-2 pb-1 w-full transition-all duration-200 ${
            isDragging ? "" : "hover:bg-button-secondBg rounded-lg"
          } focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0`}
          onClick={(e) => {
            // Prevent navigation if we're in drag mode or hovering for drop
            if (isDragging || isOver || showContextMenu) {
              e.preventDefault();
            }
          }}
        >
          <div className="relative transition-all duration-200 rounded-lg">
            <img
              src={`https://www.google.com/s2/favicons?domain=${
                new URL(bookmark.url!).hostname
              }&sz=128`}
              alt={bookmark.title || ""}
              className={`w-16 h-16 rounded-xl p-2 transition-all duration-200 ${
                isOver ? "ring-2 ring-blue-400 shadow-lg" : ""
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0OEg4OFY4MEg0MFY0OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
              }}
            />
          </div>
          <div className="mt-1 w-16 text-sm text-bookmarkItem-text truncate text-center">
            {bookmark.title || new URL(bookmark.url!).hostname}
          </div>
        </a>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-background border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 z-50 min-w-[120px] backdrop-blur-sm"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            onClick={handleEditWithPrompt}
          >
            <span>✏️</span>
            Edit
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
            onClick={handleDelete}
          >
            <span>🗑️</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BookmarkItem;
