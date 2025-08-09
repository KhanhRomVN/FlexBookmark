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
    <div className="folder-card">
      <div
        className="folder-header flex items-center justify-between p-3 cursor-pointer bg-card-header"
        onClick={toggleFolder}
      >
        <div className="flex items-center">
          <div className="folder-icon mr-2">{isOpen ? "📂" : "📁"}</div>
          <div className="folder-title font-medium">{folder.title}</div>
        </div>
        <div className="flex items-center">
          <span className="text-xs mr-2">{children.length || 0} items</span>
          <button className="folder-menu-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            ⋮
          </button>
        </div>
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
