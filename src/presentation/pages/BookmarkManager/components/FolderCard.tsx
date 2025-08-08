import React, { useState } from "react";
import BookmarkCard from "./BookmarkCard";

interface FolderCardProps {
  folder: any;
  depth: number;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<any[]>([]);

  const loadChildren = async () => {
    const folderChildren = await new Promise<any[]>((resolve) =>
      chrome.bookmarks.getChildren(folder.id, resolve)
    );
    setChildren(folderChildren || []);
  };

  const toggleFolder = () => {
    if (!isOpen && children.length === 0) {
      loadChildren();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`folder-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
        depth > 0 ? "mb-2" : ""
      }`}
    >
      <div
        className="folder-header flex items-center justify-between p-3 cursor-pointer bg-gray-100 dark:bg-gray-700"
        onClick={toggleFolder}
      >
        <div className="flex items-center">
          <div className="mr-2">{isOpen ? "📂" : "📁"}</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {folder.title}
          </div>
        </div>
        <div className="text-gray-500">{isOpen ? "▼" : "▶"}</div>
      </div>

      {isOpen && (
        <div className="folder-body p-2">
          {children.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No bookmarks</div>
          ) : (
            <div className={`${depth > 0 ? "pl-4" : ""}`}>
              {children
                .filter((child) => child.url)
                .map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    item={bookmark}
                    depth={depth + 1}
                  />
                ))}

              {children
                .filter((child) => !child.url)
                .map((subfolder) => (
                  <FolderCard
                    key={subfolder.id}
                    folder={subfolder}
                    depth={depth + 1}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderCard;
