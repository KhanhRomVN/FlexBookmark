import React, { ReactNode } from "react";
import Sidebar from "../common/Sidebar";
import Header from "../common/Header";

interface MainLayoutProps {
  folders: { id: string; title: string; url?: string; children?: any[] }[];
  onSelectFolder: (id: string) => void;
  children: ReactNode;
}

/**
 * MainLayout wraps the Sidebar, Header, and page content.
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  folders,
  onSelectFolder,
  children,
}) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar folders={folders} onSelectFolder={onSelectFolder} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          {/* Allow full width content to accommodate wider cards */}
          <div className="mx-auto w-full max-w-none">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
