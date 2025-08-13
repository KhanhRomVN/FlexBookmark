import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { BookmarkNode } from "../../tab/Dashboard";

interface BookmarkItemProps {
  bookmark: BookmarkNode;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: bookmark.id,
    });

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-full"
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex flex-col items-center p-2 w-full group transition-all ${
          isDragging ? "opacity-50 scale-95" : "hover:scale-105"
        }`}
      >
        <div className="relative">
          <img
            src={`https://www.google.com/s2/favicons?domain=${
              new URL(bookmark.url!).hostname
            }&sz=128`}
            alt={bookmark.title || ""}
            className="w-14 h-14 rounded-xl bg-white p-2 shadow border border-gray-200 dark:border-gray-700 group-hover:shadow-lg transition-all"
          />
        </div>
        <div className="mt-2 w-full text-xs text-center truncate">
          {bookmark.title || new URL(bookmark.url!).hostname}
        </div>
      </a>
    </div>
  );
};

export default BookmarkItem;
