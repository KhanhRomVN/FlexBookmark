import React, { useState, useEffect } from "react";
import BookmarkCard from "./BookmarkCard";

interface FolderCardProps {
  folder: any;
  depth: number;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<any[]>([]);

  const loadChildren = async () => {
    if (folder.children) {
      setChildren(folder.children);
      return;
    }
    const folderChildren = await new Promise<any[]>((resolve) =>
      chrome.bookmarks.getChildren(folder.id, resolve)
    );
    setChildren(folderChildren || []);
  };

  const toggleFolder = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    loadChildren();
  }, []);

  return (
    <div
      className={`folder-card w-full border rounded-md ${
        !isOpen ? "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" : ""
      }`}
    >
      <div
        className="folder-header flex items-center justify-between p-3 cursor-pointer bg-card-header"
        onClick={toggleFolder}
      >
        <div className="flex items-center">
          <div className="folder-icon mr-2">{isOpen ? "📂" : "📁"}</div>
          <div className="folder-title font-medium">{folder.title}</div>
        </div>
        <div className="flex items-center">
          {/* removed count indicator */}
          <button className="folder-menu-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            ⋮
          </button>
        </div>
      </div>

      <div
        className="folder-body p-2 relative overflow-hidden"
        style={{ maxHeight: isOpen ? "none" : "20rem" }}
      >
        {children.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No bookmarks</div>
        ) : (
          <div className={`${depth > 0 ? "pl-4" : ""}`}>
            {(isOpen ? children : children.slice(0, 5)).map((item) =>
              item.url ? (
                <BookmarkCard key={item.id} item={item} depth={depth + 1} />
              ) : (
                <FolderCard key={item.id} folder={item} depth={depth + 1} />
              )
            )}
          </div>
        )}
        {!isOpen && children.length > 5 && (
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card-header to-transparent pointer-events-none"></div>
        )}
      </div>
    </div>
  );
};

export default FolderCard;
