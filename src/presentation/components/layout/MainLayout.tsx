import React, { ReactNode, useState } from "react";
import Sidebar from "../BookmarkManager/Sidebar";
import Header from "../BookmarkManager/Header";
import ThemeDrawer from "../drawer/ThemeDrawer";

interface MainLayoutProps {
  folders: { id: string; title: string; url?: string; children?: any[] }[];
  onSelectFolder: (id: string) => void;
  onAddFolder: (title: string) => Promise<void>;
  children: ReactNode;
}

/**
 * MainLayout wraps the Sidebar, Header, and page content.
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  folders,
  onSelectFolder,
  onAddFolder,
  children,
}) => {
  const [showThemeDrawer, setShowThemeDrawer] = useState(false);
  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        folders={folders}
        onSelectFolder={onSelectFolder}
        onAddFolder={onAddFolder}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onOpenTheme={() => setShowThemeDrawer(true)} />
        <main className="flex-1 overflow-y-auto p-4">
          {/* Allow full width content to accommodate wider cards */}
          <div className="mx-auto w-full max-w-none">{children}</div>
        </main>
      </div>
      <ThemeDrawer
        isOpen={showThemeDrawer}
        onClose={() => setShowThemeDrawer(false)}
      />
    </div>
  );
};

export default MainLayout;
