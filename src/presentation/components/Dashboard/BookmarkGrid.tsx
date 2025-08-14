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
  useDroppable,
  useDndContext,
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const overId = over.id.toString();
    const sourceId = active.id.toString();

    // Check if dropping on a DropZone (has position suffix)
    if (overId.includes("-")) {
      const [targetId, position] = overId.split("-");
      if (sourceId === targetId) return;

      try {
        // Move bookmark logic
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
    } else {
      // Dropping directly on bookmark/folder - create folder logic
      if (sourceId === overId) return;

      try {
        // TODO: Implement folder creation logic here
        console.log(`Create folder with ${sourceId} and ${overId}`);
      } catch (error) {
        console.error("Error creating folder:", error);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

  // Calculate max columns based on window width
  const getMaxCols = (): number => {
    <div className="w-full max-w-6xl"></div>;
    const width = window.innerWidth;
    if (width >= 1024) return 8; // Reduced to accommodate larger items
    if (width >= 768) return 6; // Reduced to accommodate larger items
    if (width >= 640) return 4; // Reduced to accommodate larger items
    return 3; // Reduced to accommodate larger items
  };

  // Render items with extended drop areas
  const renderBookmarkItems = (items: BookmarkNode[]) => {
    const result: React.ReactNode[] = [];

    items.forEach((bm, index) => {
      // Add bookmark item with extended drop area
      result.push(
        <div key={bm.id} className="relative flex items-center">
          {/* The bookmark item */}
          <div className="flex-shrink-0">
            {bm.url ? (
              <BookmarkItem bookmark={bm} />
            ) : (
              <FolderPreview folder={bm} openFolder={openFolder} />
            )}
          </div>

          {/* Extended drop area for positioning after this item */}
          {index < items.length - 1 && <DropIndicator id={`${bm.id}-right`} />}
        </div>
      );
    });

    return result;
  };

  // Simple drop indicator component
  interface DropIndicatorProps {
    id: string;
  }

  const DropIndicator: React.FC<DropIndicatorProps> = ({ id }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const { active } = useDndContext();

    return (
      <div
        ref={setNodeRef}
        className={`flex items-center justify-center transition-all duration-200 ${
          active ? "w-10 h-16" : "w-0 h-0 overflow-hidden"
        }`}
        style={{
          pointerEvents: active ? "auto" : "none",
          backgroundColor:
            active && isOver ? "rgba(59, 130, 246, 0.3)" : "transparent",
        }}
      >
        {active && (
          <div
            className={`transition-all duration-200 rounded-sm ${
              isOver
                ? "w-2 h-16 bg-blue-500 shadow-lg"
                : "w-px h-14 bg-gray-400 opacity-60"
            }`}
          />
        )}
      </div>
    );
  };

  // Render rows
  const renderBookmarkRows = () => {
    const maxCols = getMaxCols();
    const row1 = bookmarks.slice(0, maxCols);
    const row2 = bookmarks.slice(maxCols, maxCols * 2);

    return (
      <>
        <div className="flex items-center justify-evenly w-full mb-8 px-4">
          {renderBookmarkItems(row1)}
        </div>
        {row2.length > 0 && (
          <div className="flex items-center justify-evenly w-full px-4">
            {renderBookmarkItems(row2)}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-4xl">
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
          <div className="flex flex-col items-center">
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
                  className="w-14 h-14 mx-auto"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
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
