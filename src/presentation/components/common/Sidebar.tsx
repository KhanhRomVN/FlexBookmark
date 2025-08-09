import React from "react";

interface FolderNode {
  id: string;
  title: string;
  url?: string;
  children?: FolderNode[];
}

interface SidebarProps {
  folders: FolderNode[];
  onSelectFolder: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ folders, onSelectFolder }) => {
  return (
    <div className="sidebar w-72 bg-background-secondary text-text-primary h-full flex flex-col">
      <div className="sidebar-header p-4 border-b border-border-secondary">
        <h1 className="text-2xl font-bold">FlexBookmark</h1>
      </div>

      <div className="groups-list flex-1 overflow-y-auto p-2">
        {(() => {
          const groups: FolderNode[] = [];
          folders.forEach((node) => {
            if (node.url) return;
            if (node.title === "Other bookmarks" && node.children) {
              node.children
                .filter((child: FolderNode) => !child.url)
                .forEach((child: FolderNode) => groups.push(child));
            } else {
              groups.push(node);
            }
          });
          return groups.map((folder) => (
            <div
              key={folder.id}
              className="group-item flex items-center justify-between p-3 rounded mb-1 cursor-pointer hover:bg-background-primary text-lg"
              onClick={() => onSelectFolder(folder.id)}
            >
              <div className="group-name truncate">{folder.title}</div>
              <span className="group-count bg-background-tertiary rounded-full px-2 py-1 text-xs">
                {folder.children?.length || 0}
              </span>
            </div>
          ));
        })()}
      </div>

      <footer className="sidebar-footer p-4 border-t border-border-secondary">
        <button className="add-group-btn w-full py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md">
          + New Folder
        </button>
      </footer>
    </div>
  );
};

export default Sidebar;
