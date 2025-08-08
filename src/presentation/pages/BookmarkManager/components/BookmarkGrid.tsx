import React, { useEffect, useState } from "react";
import FolderCard from "./FolderCard";
import EmptyState from "./EmptyState";
import GridHeader from "./GridHeader";

interface BookmarkGridProps {
  folderId: string | null;
  folders: any[];
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ folderId }) => {
  const [items, setItems] = useState<any[]>([]);
  const [folder, setFolder] = useState<any>(null);

  useEffect(() => {
    const loadItems = async () => {
      if (!folderId) return;

      const folderItems = await new Promise<any[]>((resolve) =>
        chrome.bookmarks.getChildren(folderId, resolve)
      );

      const folderData = await new Promise<any>((resolve) =>
        chrome.bookmarks.get(folderId, ([folder]) => resolve(folder))
      );

      setItems(folderItems || []);
      setFolder(folderData);
    };

    loadItems();
  }, [folderId]);

  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bookmark-grid" id="bookmark-grid" data-parent-id={folderId}>
      <GridHeader folderId={folderId} folder={folder} depth={0} />

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {items
            .filter((item) => !item.url)
            .map((folder) => (
              <FolderCard key={folder.id} folder={folder} depth={0} />
            ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkGrid;
