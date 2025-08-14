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
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

interface BookmarkGridProps {
  bookmarks: BookmarkNode[];
  currentFolder: BookmarkNode | null;
  folderHistory: BookmarkNode[];
  openFolder: (folder: BookmarkNode) => void;
  goBack: () => void;
  exitToRootFolder: () => void;
  barFolderId: string;
  loadBookmarks: () => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  currentFolder,
  openFolder,
  goBack,
  exitToRootFolder,
  barFolderId,
  loadBookmarks,
  currentPage,
  setCurrentPage,
}) => {
  const [activeDragItem, setActiveDragItem] = useState<BookmarkNode | null>(
    null
  );
  const [allBookmarks, setAllBookmarks] = useState<BookmarkNode[]>(bookmarks);
  const [hoveringArrow, setHoveringArrow] = useState<"left" | "right" | null>(
    null
  );
  const [hasTriggeredBackExit, setHasTriggeredBackExit] =
    useState<boolean>(false);

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
    setHasTriggeredBackExit(false); // Reset the flag when starting new drag
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setHoveringArrow(null);
      return;
    }

    const overId = over.id.toString();
    if (overId === "arrow-left") {
      setHoveringArrow("left");
    } else if (overId === "arrow-right") {
      setHoveringArrow("right");
    } else if (
      overId === "back-to-root" &&
      currentFolder &&
      activeDragItem &&
      !hasTriggeredBackExit
    ) {
      // Exit folder while maintaining drag state - only once per drag session
      setHasTriggeredBackExit(true);
      exitToRootFolder();
    } else {
      setHoveringArrow(null);
    }
  };

  const createFolder = async (bookmark1Id: string, bookmark2Id: string) => {
    try {
      // Get both bookmarks to get their titles and parent info
      const [bookmark1] = await new Promise<
        chrome.bookmarks.BookmarkTreeNode[]
      >((resolve) => chrome.bookmarks.get(bookmark1Id, resolve));
      const [bookmark2] = await new Promise<
        chrome.bookmarks.BookmarkTreeNode[]
      >((resolve) => chrome.bookmarks.get(bookmark2Id, resolve));

      // Prompt for folder name with default suggestion
      const defaultName = `${bookmark1.title} & ${bookmark2.title}`;
      const folderTitle = prompt(`Enter folder name:`, defaultName);

      if (!folderTitle || folderTitle.trim() === "") {
        return; // User cancelled or entered empty name
      }

      const parentId = bookmark1.parentId;

      // Create new folder
      const newFolder = await new Promise<chrome.bookmarks.BookmarkTreeNode>(
        (resolve) =>
          chrome.bookmarks.create(
            { parentId, title: folderTitle.trim() },
            resolve
          )
      );

      // Move both bookmarks into the new folder
      await new Promise<void>((resolve) =>
        chrome.bookmarks.move(bookmark1Id, { parentId: newFolder.id }, () =>
          resolve()
        )
      );
      await new Promise<void>((resolve) =>
        chrome.bookmarks.move(bookmark2Id, { parentId: newFolder.id }, () =>
          resolve()
        )
      );

      loadBookmarks();
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const moveBookmarkToFolder = async (bookmarkId: string, folderId: string) => {
    try {
      await new Promise<void>((resolve) =>
        chrome.bookmarks.move(bookmarkId, { parentId: folderId }, () =>
          resolve()
        )
      );
      loadBookmarks();
    } catch (error) {
      console.error("Error moving bookmark to folder:", error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setHoveringArrow(null);

    if (!over) return;

    const overId = over.id.toString();
    const sourceId = active.id.toString();

    // Handle arrow navigation
    if (overId === "arrow-left" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
      return;
    }
    if (overId === "arrow-right" && hasNextPage()) {
      setCurrentPage(currentPage + 1);
      return;
    }
    // Remove back-to-root handling from dragEnd since it's now in dragOver

    // Check if dropping on a DropZone (has position suffix)
    if (overId.includes("-")) {
      const [targetId, position] = overId.split("-");
      if (sourceId === targetId) return;

      try {
        // Move bookmark logic for positioning
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
      // Dropping directly on bookmark/folder
      if (sourceId === overId) return;

      const sourceItem = allBookmarks.find((bm) => bm.id === sourceId);
      const targetItem = allBookmarks.find((bm) => bm.id === overId);

      if (!sourceItem || !targetItem) return;

      // Handle different drop scenarios based on folder context
      if (currentFolder) {
        // Inside folder - only BookmarkItems exist, no folder creation
        return; // Do nothing when dropping BookmarkItem on BookmarkItem inside folder
      } else {
        // Root folder
        if (!sourceItem.url && targetItem.url) {
          // FolderPreview on BookmarkItem - do nothing
          return;
        }
        if (!sourceItem.url && !targetItem.url) {
          // FolderPreview on FolderPreview - do nothing
          return;
        }
        if (sourceItem.url && !targetItem.url) {
          // BookmarkItem on FolderPreview - move bookmark into folder
          await moveBookmarkToFolder(sourceId, overId);
        }
        if (sourceItem.url && targetItem.url) {
          // BookmarkItem on BookmarkItem - create folder and move both
          await createFolder(sourceId, overId);
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
    setHoveringArrow(null);
    setHasTriggeredBackExit(false);
  };

  // Calculate max columns and items per page
  const getMaxCols = (): number => {
    const width = window.innerWidth;
    if (width >= 1024) return 8;
    if (width >= 768) return 6;
    if (width >= 640) return 4;
    return 3;
  };

  const getItemsPerPage = (): number => {
    return getMaxCols() * 2; // 2 rows
  };

  const getCurrentPageItems = (): BookmarkNode[] => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return bookmarks.slice(startIndex, endIndex);
  };

  const hasNextPage = (): boolean => {
    const itemsPerPage = getItemsPerPage();
    return (currentPage + 1) * itemsPerPage < bookmarks.length;
  };

  const hasPrevPage = (): boolean => {
    return currentPage > 0;
  };

  // Navigation arrow component
  const NavigationArrow: React.FC<{
    direction: "left" | "right";
    visible: boolean;
    onClick: () => void;
    disabled?: boolean;
  }> = ({ direction, visible, onClick, disabled = false }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `arrow-${direction}`,
    });

    if (!visible) return <div className="w-12" />;

    return (
      <div ref={setNodeRef} className="flex items-center">
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200 border-2
            ${
              disabled
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
            }
            ${
              isOver && activeDragItem
                ? "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900"
                : ""
            }
            backdrop-blur-sm shadow-lg
          `}
        >
          {direction === "left" ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>
      </div>
    );
  };

  // Back button component (only visible in folder while dragging)
  const BackButton: React.FC = () => {
    const { setNodeRef, isOver } = useDroppable({
      id: "back-to-root",
    });

    if (!currentFolder || !activeDragItem) return null;

    return (
      <div className="relative flex items-center">
        <div className="flex-shrink-0">
          <div
            ref={setNodeRef}
            className={`
              flex flex-col items-center p-3 w-full transition-all duration-200
              ${
                isOver
                  ? "ring-2 ring-orange-500 rounded-xl bg-orange-50/50 dark:bg-orange-900/30 scale-105"
                  : "hover:scale-105 hover:bg-white/20 dark:hover:bg-black/10 rounded-xl"
              }
            `}
          >
            <div
              className={`relative transition-all duration-200 rounded-xl ${
                isOver ? "shadow-lg ring-2 ring-orange-400" : ""
              }`}
            >
              <div className="w-16 h-16 rounded-xl bg-orange-500 p-2 flex items-center justify-center transition-all duration-200">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </div>
            </div>
            <div className="mt-3 w-16 text-sm text-bookmarkItem-text truncate text-center">
              Back
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render items with extended drop areas and back button
  const renderBookmarkItems = (items: BookmarkNode[]) => {
    const result: React.ReactNode[] = [];

    // Add back button at the beginning if in folder and dragging
    if (currentFolder && activeDragItem) {
      result.push(<BackButton key="back-button" />);
    }

    items.forEach((bm, index) => {
      result.push(
        <div key={bm.id} className="relative flex items-center">
          <div className="flex-shrink-0">
            {bm.url ? (
              <BookmarkItem bookmark={bm} />
            ) : (
              <FolderPreview folder={bm} openFolder={openFolder} />
            )}
          </div>
          {index < items.length - 1 && <DropIndicator id={`${bm.id}-right`} />}
        </div>
      );
    });

    return result;
  };

  // Drop indicator component
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

  // Render rows with pagination
  const renderBookmarkRows = () => {
    const currentItems = getCurrentPageItems();
    const maxCols = getMaxCols();
    const row1 = currentItems.slice(0, maxCols);
    const row2 = currentItems.slice(maxCols, maxCols * 2);

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

  const totalPages = Math.ceil(bookmarks.length / getItemsPerPage());

  return (
    <div className="w-full max-w-4xl relative">
      <BookmarkGridHeader
        currentFolder={currentFolder}
        goBack={goBack}
        itemCount={bookmarks.length}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {bookmarks.length > 0 ? (
          <div className="flex items-center justify-between w-full">
            {/* Left Arrow */}
            <NavigationArrow
              direction="left"
              visible={totalPages > 1}
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={!hasPrevPage()}
            />

            {/* Bookmark Grid */}
            <div className="flex flex-col items-center flex-1">
              {renderBookmarkRows()}

              {/* Page indicator */}
              {totalPages > 1 && (
                <div className="mt-4 flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        i === currentPage
                          ? "bg-blue-500 scale-125"
                          : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Arrow */}
            <NavigationArrow
              direction="right"
              visible={totalPages > 1}
              onClick={() =>
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
              }
              disabled={!hasNextPage()}
            />
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
            <div className="opacity-80 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xl border-2 border-blue-500 transform scale-110 transition-transform">
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
