import React from "react";
import { BookmarkNode } from "../../tab/Dashboard";
import BookmarkItem from "./BookmarkItem";
import FolderPreview from "./FolderPreview";

interface BookmarkGridProps {
  bookmarks: BookmarkNode[];
  currentFolder: BookmarkNode | null;
  folderHistory: BookmarkNode[];
  openFolder: (folder: BookmarkNode) => void;
  goBack: () => void;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  currentFolder,
  folderHistory,
  openFolder,
  goBack,
}) => {
  return (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {currentFolder && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
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
              <span>Back</span>
            </button>
          )}
          <div className="text-xl font-semibold">
            {currentFolder?.title || "Bookmarks"}
          </div>
        </div>
        <div className="text-sm opacity-80">
          {bookmarks.length} {bookmarks.length === 1 ? "item" : "items"}
        </div>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 justify-items-center">
          {bookmarks.map((bm) =>
            bm.url ? (
              <BookmarkItem key={bm.id} bookmark={bm} />
            ) : (
              <FolderPreview key={bm.id} folder={bm} openFolder={openFolder} />
            )
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <div className="text-xl opacity-80">
            No bookmarks match your search
          </div>
          <div className="mt-2 opacity-60">Try a different search term</div>
        </div>
      )}
    </div>
  );
};

export default BookmarkGrid;
