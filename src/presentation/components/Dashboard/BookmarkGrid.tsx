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
import DropZone from "./DropZone";

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

  // drag-over no longer tracks activeDropId

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const [targetId, position] = over.id.toString().split("-");
    const sourceId = active.id.toString();
    if (sourceId === targetId) return;

    try {
      // Retrieve nodes
      const [sourceNode] = await new Promise<
        chrome.bookmarks.BookmarkTreeNode[]
      >((resolve) => chrome.bookmarks.get(sourceId, resolve));
      const [targetNode] = await new Promise<
        chrome.bookmarks.BookmarkTreeNode[]
      >((resolve) => chrome.bookmarks.get(targetId, resolve));
      const parentId = targetNode.parentId;
      const targetIndex = targetNode.index ?? 0;
      const newIndex = position === "right" ? targetIndex + 1 : targetIndex;

      await new Promise<void>((resolve) =>
        chrome.bookmarks.move(sourceId, { parentId, index: newIndex }, () =>
          resolve()
        )
      );
      loadBookmarks();
    } catch (error) {
      console.error("Error moving bookmark:", error);
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

  // Calculate max columns based on window width
  const getMaxCols = (): number => {
    const width = window.innerWidth;
    if (width >= 1024) return 10;
    if (width >= 768) return 8;
    if (width >= 640) return 6;
    return 4;
  };

  // DropZone id will be direct bookmark id

  // Render items with a single right-side drop zone
  const renderBookmarkItems = (items: BookmarkNode[]) =>
    items.map((bm) => (
      <div key={bm.id} className="relative flex items-center justify-center">
        <div className="z-10">
          {bm.url ? (
            <BookmarkItem bookmark={bm} />
          ) : (
            <FolderPreview folder={bm} openFolder={openFolder} />
          )}
        </div>
        <DropZone id={`${bm.id}-right`} position="right" />
      </div>
    ));

  // Render rows
  const renderBookmarkRows = () => {
    const maxCols = getMaxCols();
    const row1 = bookmarks.slice(0, maxCols);
    const row2 = bookmarks.slice(maxCols, maxCols * 2);
    return (
      <>
        <div className="flex flex-wrap justify-center gap-4 w-full mb-4 relative">
          {renderBookmarkItems(row1)}
        </div>
        {row2.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 w-full relative">
            {renderBookmarkItems(row2)}
          </div>
        )}
      </>
    );
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
        onDragCancel={handleDragCancel}
      >
        {bookmarks.length > 0 ? (
          <div className="flex flex-col items-center relative">
            {renderBookmarkRows()}
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
