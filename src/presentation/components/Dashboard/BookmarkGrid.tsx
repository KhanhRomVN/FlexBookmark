import React, { useState, useEffect } from "react";
import { BookmarkNode } from "../../tab/Dashboard";
import BookmarkItem from "./BookmarkItem";
import FolderPreview from "./FolderPreview";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  onBookmarkEdit: (bookmark: BookmarkNode) => void;
  onBookmarkDelete: (bookmarkId: string) => void;
  onFolderRename: (folderId: string, newTitle: string) => void;
  onFolderDelete: (folderId: string, moveBookmarksOut: boolean) => void;
  onAddBookmark: (folderId: string) => void;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  currentFolder,
  openFolder,
  goBack,
  exitToRootFolder,
  loadBookmarks,
  currentPage,
  setCurrentPage,
  onBookmarkEdit,
  onBookmarkDelete,
  onFolderRename,
  onFolderDelete,
  onAddBookmark,
}) => {
  const [activeDragItem, setActiveDragItem] = useState<BookmarkNode | null>(
    null
  );
  const [allBookmarks, setAllBookmarks] = useState<BookmarkNode[]>(bookmarks);
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
    setHasTriggeredBackExit(false);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;

    const overId = over.id.toString();

    // Handle quick navigation on arrow hover
    if (overId === "arrow-left" && hasPrevPage()) {
      setCurrentPage(Math.max(0, currentPage - 1));
      return;
    }
    if (overId === "arrow-right" && hasNextPage()) {
      setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
      return;
    }

    // Handle back to root folder
    if (
      overId === "back-to-root" &&
      currentFolder &&
      activeDragItem &&
      !hasTriggeredBackExit
    ) {
      setHasTriggeredBackExit(true);
      exitToRootFolder();
    }
  };

  const createFolder = async (bookmark1Id: string, bookmark2Id: string) => {
    try {
      const [bookmark1] = await new Promise<
        chrome.bookmarks.BookmarkTreeNode[]
      >((resolve) => chrome.bookmarks.get(bookmark1Id, resolve));
      const [bookmark2] = await new Promise<
        chrome.bookmarks.BookmarkTreeNode[]
      >((resolve) => chrome.bookmarks.get(bookmark2Id, resolve));

      const defaultName = `${bookmark1.title} & ${bookmark2.title}`;
      const folderTitle = prompt(`Enter folder name:`, defaultName);

      if (!folderTitle || folderTitle.trim() === "") {
        return;
      }

      const parentId = bookmark1.parentId;

      const newFolder = await new Promise<chrome.bookmarks.BookmarkTreeNode>(
        (resolve) =>
          chrome.bookmarks.create(
            { parentId, title: folderTitle.trim() },
            resolve
          )
      );

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

    if (!over) return;

    const dropId = over.id.toString();
    const sourceId = active.id.toString();

    // Quick page-switch when dropping directly on navigation arrows
    if (dropId === "arrow-left" && hasPrevPage()) {
      setCurrentPage(Math.max(0, currentPage - 1));
      return;
    }
    if (dropId === "arrow-right" && hasNextPage()) {
      setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
      return;
    }

    // Dropping directly on bookmark/folder
    if (sourceId === dropId) return;

    const sourceItem = allBookmarks.find((bm) => bm.id === sourceId);
    const targetItem = allBookmarks.find((bm) => bm.id === dropId);

    if (!sourceItem || !targetItem) return;

    // Handle different drop scenarios based on folder context
    if (currentFolder) {
      // Inside folder - only BookmarkItems exist, no folder creation
      return;
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
        await moveBookmarkToFolder(sourceId, dropId);
      }
      if (sourceItem.url && targetItem.url) {
        // BookmarkItem on BookmarkItem - create folder and move both
        await createFolder(sourceId, dropId);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
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
      <div ref={setNodeRef} className="flex items-center -mt-8">
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
          w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-200 border-2
          bg-button-secondBg hover:bg-button-secondBgHover 
          border-button-secondBg hover:border-button-secondBgHover
          backdrop-blur-sm shadow-lg
          ${disabled ? "opacity-40 cursor-not-allowed" : "opacity-100"}
          ${isOver && activeDragItem ? "scale-105" : ""}
        `}
        >
          {direction === "left" ? (
            <ChevronLeft
              size={20}
              className={`transition-colors duration-200 ${
                disabled
                  ? "text-text-secondary opacity-50"
                  : "text-text-primary"
              }`}
            />
          ) : (
            <ChevronRight
              size={20}
              className={`transition-colors duration-200 ${
                disabled
                  ? "text-text-secondary opacity-50"
                  : "text-text-primary"
              }`}
            />
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

    if (!currentFolder) return null;

    return (
      <div className="relative flex items-center">
        <div
          ref={setNodeRef}
          onClick={() => goBack()}
          className={`
            flex flex-col items-center p-3 w-full transition-all duration-200 cursor-pointer
            ${
              isOver
                ? "rounded-xl bg-button-bg scale-105"
                : "hover:scale-105 hover:bg-button-secondBg rounded-xl"
            }
          `}
        >
          <div
            className={`relative transition-all duration-200 rounded-xl ${
              isOver ? "shadow-lg" : ""
            }`}
          >
            <div className="w-16 h-16 rounded-xl bg-button-bg p-2 flex items-center justify-center transition-all duration-200">
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
    );
  };

  // Render bookmark grid
  const renderBookmarkGrid = () => {
    const currentItems = getCurrentPageItems();
    const maxCols = getMaxCols();
    const allItems: React.ReactNode[] = [];

    // Add back button at the beginning if in folder
    if (currentFolder) {
      allItems.push(<BackButton key="back-button" />);
    }

    // Add all bookmark items
    currentItems.forEach((bm) => {
      allItems.push(
        bm.url ? (
          <BookmarkItem
            key={bm.id}
            bookmark={bm}
            onEdit={onBookmarkEdit}
            onDelete={onBookmarkDelete}
          />
        ) : (
          <FolderPreview
            key={bm.id}
            folder={bm}
            openFolder={openFolder}
            onRename={onFolderRename}
            onDelete={onFolderDelete}
            onAddBookmark={onAddBookmark}
          />
        )
      );
    });

    return (
      <div
        className="grid gap-4 px-4 w-full place-items-center"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
          gridTemplateRows: "repeat(2, minmax(0, 1fr))",
        }}
      >
        {allItems}
      </div>
    );
  };

  const totalPages = Math.ceil(bookmarks.length / getItemsPerPage());

  return (
    <div className="w-full">
      <div className="w-full max-w-6xl mx-auto relative">
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
                {renderBookmarkGrid()}

                {/* Page indicator */}
                {totalPages > 1 && (
                  <div className="mt-6 flex space-x-2">
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
    </div>
  );
};

export default BookmarkGrid;
