import React from "react";
import { BookmarkNode } from "../../tab/Dashboard";

interface BookmarkGridHeaderProps {
  currentFolder: BookmarkNode | null;
  goBack: () => void;
  itemCount: number;
}

const BookmarkGridHeader: React.FC<BookmarkGridHeaderProps> = ({
  currentFolder,
  goBack,
  itemCount,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {currentFolder && (
          <button
            onClick={goBack}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        <h2 className="text-xl font-semibold">
          {currentFolder?.title || "Bookmarks"}
        </h2>
      </div>
      <div className="text-sm text-text-primary">
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </div>
    </div>
  );
};

export default BookmarkGridHeader;
