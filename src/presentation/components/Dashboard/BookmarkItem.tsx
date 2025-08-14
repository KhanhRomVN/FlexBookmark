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

  // Add droppable for folder creation
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
        className={`w-full focus:outline-none focus:ring-0 transition-colors ${
          isDragging ? "opacity-0" : ""
        } ${isOver ? "ring-2 ring-blue-500 rounded-xl" : ""}`}
      >
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col items-center p-2 w-full transition-all ${
            isDragging ? "opacity-50" : "hover:scale-105"
          } focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0`}
          onClick={(e) => {
            // Prevent navigation if we're in drag mode or hovering for drop
            if (isDragging || isOver) {
              e.preventDefault();
            }
          }}
        >
          <div className="relative transition-colors rounded-xl">
            <img
              src={`https://www.google.com/s2/favicons?domain=${
                new URL(bookmark.url!).hostname
              }&sz=128`}
              alt={bookmark.title || ""}
              className="w-14 h-14 rounded-xl bg-bookmarkItem-bg p-2 transition-all"
            />
          </div>
          <div className="mt-2 w-14 text-xs text-bookmarkItem-text truncate">
            {bookmark.title || new URL(bookmark.url!).hostname}
          </div>
        </a>
      </div>
    </div>
  );
};

export default BookmarkItem;
