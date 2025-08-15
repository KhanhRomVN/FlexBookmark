import React, { useState, useEffect, useRef } from "react";
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
  useDndContext,
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
  const [, setHoveringArrow] = useState<"left" | "right" | null>(null);
  const [hasTriggeredBackExit, setHasTriggeredBackExit] =
    useState<boolean>(false);
  const [hasTriggeredPageChange, setHasTriggeredPageChange] = useState<{
    left: boolean;
    right: boolean;
  }>({ left: false, right: false });

  // toast for drag confirmation
  const [showDragToast, setShowDragToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastDirection, setToastDirection] = useState<"left" | "right" | null>(
    null
  );
  // ref to auto-hide toast after delay
  const hideToastTimeout = useRef<NodeJS.Timeout | null>(null);
  // droppable zone for toast confirmation (treat toast as arrow hover)
  const { setNodeRef: setToastRef, isOver: isOverToast } = useDroppable({
    id: toastDirection ? `toast-${toastDirection}` : "toast-disabled",
  });

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
    setHasTriggeredPageChange({ left: false, right: false });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setHoveringArrow(null);
      setHasTriggeredPageChange({ left: false, right: false });
      // do not hide toast here; let timer handle visibility
      return;
    }

    const overId = over.id.toString();
    if (overId === "arrow-left") {
      setHoveringArrow("left");
      setHasTriggeredPageChange((prev) => ({ ...prev, right: false }));
      // defer actual page change until user confirms via toast
      setToastDirection("left");
      setShowDragToast(true);
      // schedule auto-hide toast
      if (hideToastTimeout.current) clearTimeout(hideToastTimeout.current);
      hideToastTimeout.current = setTimeout(() => {
        setShowDragToast(false);
        setToastDirection(null);
        hideToastTimeout.current = null;
      }, 5000);
    } else if (overId === "arrow-right") {
      setHoveringArrow("right");
      setHasTriggeredPageChange((prev) => ({ ...prev, left: false }));
      setToastDirection("right");
      setShowDragToast(true);
      if (hideToastTimeout.current) clearTimeout(hideToastTimeout.current);
      hideToastTimeout.current = setTimeout(() => {
        setShowDragToast(false);
        setToastDirection(null);
        hideToastTimeout.current = null;
      }, 5000);
    } else if (
      overId === "back-to-root" &&
      currentFolder &&
      activeDragItem &&
      !hasTriggeredBackExit
    ) {
      setHasTriggeredBackExit(true);
      exitToRootFolder();
    } else {
      setHoveringArrow(null);
      setHasTriggeredPageChange({ left: false, right: false });
      // do not hide toast here
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
    setHoveringArrow(null);
    setShowDragToast(false);

    if (!over) return;

    // drop on toast confirmation zone
    const toastOverId = over.id.toString();
    if (toastOverId.startsWith("toast-")) {
      const dir = toastOverId.split("-")[1] as "left" | "right";
      if (dir === "left" && hasPrevPage()) {
        setCurrentPage(Math.max(0, currentPage - 1));
      }
      if (dir === "right" && hasNextPage()) {
        setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
      }
      return;
    }

    // quick page-switch when dropping directly on navigation arrows
    const overId = over.id.toString();
    if (overId === "arrow-left" && hasPrevPage()) {
      setCurrentPage(Math.max(0, currentPage - 1));
      return;
    }
    if (overId === "arrow-right" && hasNextPage()) {
      setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
      return;
    }

    const dropId = over.id.toString();
    const sourceId = active.id.toString();

    // Check if dropping on a DropZone (has position suffix)
    if (dropId.includes("-")) {
      const [targetId, position] = dropId.split("-");
      if (sourceId === targetId) return;

      try {
        const [] = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
          (resolve) => chrome.bookmarks.get(sourceId, resolve)
        );
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
    setHasTriggeredPageChange({ left: false, right: false });
    +setShowDragToast(false);
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
            ${
              disabled
                ? "bg-button-secondBg text-text-secondary cursor-not-allowed"
                : "bg-button-bg hover:bg-button-bgHover text-text-primary"
            }
            ${
              isOver && activeDragItem
                ? "bg-button-secondBg text-text-secondary"
                : "text-text-secondary"
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

    if (!currentFolder) return null;

    return (
      <div className="relative flex items-center">
        <div className="flex-shrink-0">
          <div
            ref={setNodeRef}
            onClick={() => goBack()} // <-- thêm click để quay lại
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
      </div>
    );
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

  // Render items with extended drop areas and back button
  const renderBookmarkItems = (items: BookmarkNode[]) => {
    const result: React.ReactNode[] = [];

    // Add back button at the beginning if in folder
    if (currentFolder) {
      result.push(<BackButton key="back-button" />);
    }

    items.forEach((bm, index) => {
      result.push(
        <div key={bm.id} className="relative flex items-center">
          <div className="flex-shrink-0">
            {bm.url ? (
              <BookmarkItem
                bookmark={bm}
                onEdit={onBookmarkEdit}
                onDelete={onBookmarkDelete}
              />
            ) : (
              <FolderPreview
                folder={bm}
                openFolder={openFolder}
                onRename={onFolderRename}
                onDelete={onFolderDelete}
                onAddBookmark={onAddBookmark}
              />
            )}
          </div>
          {index < items.length - 1 && <DropIndicator id={`${bm.id}-right`} />}
        </div>
      );
    });

    return result;
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
        {/* Drag confirmation toast */}
        <AnimatePresence>
          {showDragToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-4 right-4 p-4 border-2 border-dashed rounded-lg bg-black bg-opacity-60 text-white text-center pointer-events-auto"
            >
              <div className="mb-2 text-sm">{toastMessage}</div>
              <div
                ref={setToastRef}
                className={`p-2 border-2 rounded transition-colors ${
                  isOverToast
                    ? "bg-blue-500 text-white border-blue-400"
                    : "bg-gray-200 text-gray-800 border-gray-400"
                }`}
              >
                Drop here
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookmarkGrid;
