import React, { useState, useEffect } from "react";
import { BookmarkNode } from "../../tab/Dashboard";
import BookmarkItem from "./BookmarkItem";
import FolderPreview from "./FolderPreview";
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import BookmarkGridHeader from "./BookmarkGridHeader";

interface BookmarkGridProps {
  bookmarks: BookmarkNode[];
  currentFolder: BookmarkNode | null;
  folderHistory: BookmarkNode[];
  openFolder: (folder: BookmarkNode) => void;
  goBack: () => void;
  barFolderId: string;
  loadBookmarks: () => void;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  currentFolder,
  openFolder,
  goBack,
  barFolderId,
  loadBookmarks,
}) => {
  const [activeDragItem, setActiveDragItem] = useState<BookmarkNode | null>(
    null
  );
  const [allBookmarks, setAllBookmarks] = useState<BookmarkNode[]>(bookmarks);
  const [activeDropId, setActiveDropId] = useState<UniqueIdentifier | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    setAllBookmarks(bookmarks);
  }, [bookmarks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedItem = allBookmarks.find((bm) => bm.id === active.id);
    if (draggedItem) setActiveDragItem(draggedItem);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setActiveDropId(over.id);
    } else {
      setActiveDropId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setActiveDropId(null);

    if (!over) return;

    const targetItem = allBookmarks.find((bm) => bm.id === over.id);
    if (!targetItem || targetItem.id === active.id) return;

    const folderName = window.prompt("Enter new folder name:");
    if (!folderName) return;
    try {
      const newFolder = await new Promise<chrome.bookmarks.BookmarkTreeNode>(
        (res, rej) =>
          chrome.bookmarks.create(
            { title: folderName, parentId: currentFolder?.id || barFolderId },
            (node) =>
              chrome.runtime.lastError
                ? rej(chrome.runtime.lastError)
                : res(node)
          )
      );
      await chrome.bookmarks.move(active.id as string, {
        parentId: newFolder.id,
      });
      await chrome.bookmarks.move(targetItem.id, {
        parentId: newFolder.id,
        index: 1,
      });
      loadBookmarks();
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
    setActiveDropId(null);
  };

  return (
    <div className="w-full max-w-6xl">
      <BookmarkGridHeader
        currentFolder={currentFolder}
        goBack={goBack}
        itemCount={bookmarks.length}
      />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
      >
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 justify-items-center relative">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="relative">
                {/* <GapDropZone position="left" index={index} /> */}

                {bm.url ? (
                  <BookmarkItem
                    bookmark={bm}
                    isDropTarget={activeDropId === bm.id}
                  />
                ) : (
                  <FolderPreview
                    folder={bm}
                    openFolder={openFolder}
                    isDropTarget={activeDropId === bm.id}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
            <div className="text-xl opacity-80">
              No bookmarks match your search
            </div>
            <div className="mt-2 opacity-60">Try a different search term</div>
          </div>
        )}

        <DragOverlay>
          {activeDragItem && (
            <div className="opacity-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-blue-500 transform scale-110 transition-transform">
              {activeDragItem.url ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${
                    new URL(activeDragItem.url).hostname
                  }&sz=128`}
                  alt={activeDragItem.title}
                  className="w-12 h-12 mx-auto"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-xl">📁</span>
                </div>
              )}
              <div className="mt-1 text-xs text-center truncate max-w-[80px]">
                {activeDragItem.title}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default BookmarkGrid;
