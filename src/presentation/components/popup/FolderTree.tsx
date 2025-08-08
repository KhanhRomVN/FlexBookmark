import React, { useState } from "react";

interface FolderTreeProps {
  folders: any[];
  onSelectFolder: (id: string) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({ folders, onSelectFolder }) => {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const renderFolder = (folder: any, level = 0) => {
    const hasChildren =
      folder.children && folder.children.some((c: any) => !c.url);
    const isExpanded = expandedFolders[folder.id];

    return (
      <div key={folder.id} className="folder-item">
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
            level > 0 ? "ml-4" : ""
          }`}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren ? (
            <span
              className="mr-1 w-4 text-center"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </span>
          ) : (
            <span className="mr-1 w-4 text-center">•</span>
          )}

          <span className="truncate">📁 {folder.title}</span>
        </div>

        {isExpanded && hasChildren && (
          <div className="folder-children">
            {folder.children
              .filter((child: any) => !child.url)
              .map((child: any) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800">
      {folders
        .filter((folder) => !folder.url)
        .map((folder) => renderFolder(folder))}
    </div>
  );
};

export default FolderTree;
