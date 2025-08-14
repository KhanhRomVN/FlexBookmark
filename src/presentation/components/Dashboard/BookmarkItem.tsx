import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { BookmarkNode } from "../../tab/Dashboard";

interface BookmarkItemProps {
  bookmark: BookmarkNode;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark }) => {
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
        {...listeners}
        {...attributes}
        className={`w-full focus:outline-none focus:ring-0 transition-all duration-200 ${
          isDragging ? "opacity-0" : ""
        } ${
          isOver
            ? "ring-2 ring-blue-500 rounded-xl bg-blue-50/50 dark:bg-blue-900/30"
            : ""
        }`}
      >
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col items-center p-3 w-full transition-all duration-200 ${
            isDragging
              ? "opacity-50"
              : "hover:scale-105 hover:bg-white/20 dark:hover:bg-black/10 rounded-xl"
          } focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0`}
          onClick={(e) => {
            // Prevent navigation if we're in drag mode or hovering for drop
            if (isDragging || isOver) {
              e.preventDefault();
            }
          }}
        >
          <div className="relative transition-all duration-200 rounded-xl">
            <img
              src={`https://www.google.com/s2/favicons?domain=${
                new URL(bookmark.url!).hostname
              }&sz=128`}
              alt={bookmark.title || ""}
              className={`w-16 h-16 rounded-xl bg-bookmarkItem-bg p-2 transition-all duration-200 ${
                isOver ? "shadow-lg ring-2 ring-blue-400" : ""
              }`}
              onError={(e) => {
                // Fallback to a generic icon if favicon fails to load
                const target = e.target as HTMLImageElement;
                target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0OEg4OFY4MEg0MFY0OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
              }}
            />
          </div>
          <div className="mt-3 w-16 text-sm text-bookmarkItem-text truncate text-center">
            {bookmark.title || new URL(bookmark.url!).hostname}
          </div>
        </a>
      </div>
    </div>
  );
};

export default BookmarkItem;
