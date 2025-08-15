import React, { useState } from "react";
import { Folder, ChevronDown, ChevronRight } from "lucide-react";

interface FolderTreeProps {
  folders: any[];
  onSelectFolder: (id: string) => void;
  selectedFolderId: string | null;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  onSelectFolder,
  selectedFolderId,
}) => {
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
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id} className="folder-item">
        <div
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? "bg-primary/10 text-primary"
              : "hover:bg-sidebar-item-hover"
          }`}
          onClick={() => onSelectFolder(folder.id)}
        >
          <div className="flex items-center">
            {hasChildren ? (
              <button
                className="mr-2 p-1 rounded hover:bg-button-second-bg-hover"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <Folder
              size={16}
              className={`mr-2 ${
                isSelected ? "text-primary" : "text-text-secondary"
              }`}
            />
            <span className="truncate">{folder.title}</span>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6 pl-2 border-l border-border-default">
            {folder.children
              .filter((child: any) => !child.url)
              .map((child: any) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-h-60 overflow-y-auto py-2">
      {folders
        .filter((folder) => !folder.url)
        .map((folder) => renderFolder(folder))}
    </div>
  );
};

export default FolderTree;
