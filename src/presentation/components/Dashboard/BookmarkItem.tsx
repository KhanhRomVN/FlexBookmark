import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { BookmarkNode } from "../../tab/Dashboard";

interface BookmarkItemProps {
  bookmark: BookmarkNode;
  /** show drop zones when dragging */
  isDragActive?: boolean;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  isDragActive,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: bookmark.id,
    });
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: bookmark.id });

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div className="relative group">
      {isDragActive && (
        <div className="absolute left-0 top-0 bottom-0 w-2 group-hover:bg-blue-200/30 transition-colors" />
      )}
      <div
        ref={dropRef}
        className={isOver ? "ring-2 ring-blue-500 rounded-lg" : ""}
      >
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
            className={`flex flex-col items-center p-2 w-full transition-all ${
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
      </div>
      {isDragActive && (
        <div className="absolute right-0 top-0 bottom-0 w-2 group-hover:bg-blue-200/30 transition-colors" />
      )}
    </div>
  );
};

export default BookmarkItem;
