import React from "react";
import { BookmarkNode } from "../../tab/Dashboard";

interface BookmarkItemProps {
  bookmark: BookmarkNode;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("bookmark/id", bookmark.id);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
  );
};

export default BookmarkItem;
