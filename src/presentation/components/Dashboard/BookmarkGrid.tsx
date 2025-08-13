import React, { useState, useEffect } from "react";
import { BookmarkNode } from "../../tab/Dashboard";
import BookmarkItem from "./BookmarkItem";
import FolderPreview from "./FolderPreview";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from "@dnd-kit/core";
import BookmarkGridHeader from "./BookmarkGridHeader";

interface BookmarkGridProps {
  bookmarks: BookmarkNode[];
  currentFolder: BookmarkNode | null;
  folderHistory: BookmarkNode[];
  openFolder: (folder: BookmarkNode) => void;
  goBack: () => void;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  currentFolder,
  folderHistory,
  openFolder,
  goBack,
}) => {
  const [activeDragItem, setActiveDragItem] = useState<BookmarkNode | null>(
    null
  );
  // store full unfiltered list to support drag operations
  const [allBookmarks, setAllBookmarks] = useState<BookmarkNode[]>(bookmarks);

  // keep allBookmarks in sync when props change
  useEffect(() => {
    setAllBookmarks(bookmarks);
  }, [bookmarks]);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [dropTarget, setDropTarget] = useState<BookmarkNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const draggedItem = allBookmarks.find((bm) => bm.id === active.id);
    if (draggedItem) setActiveDragItem(draggedItem);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || !activeDragItem) return;

    const targetItem = allBookmarks.find((bm) => bm.id === over.id);
    if (!targetItem || targetItem.id === activeDragItem.id) return;

    setDropTarget(targetItem);
    setShowFolderForm(true);
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!activeDragItem || !dropTarget) return;

    try {
      const newFolder = await new Promise<chrome.bookmarks.BookmarkTreeNode>(
        (res, rej) =>
          chrome.bookmarks.create(
            { title: folderName, parentId: currentFolder?.id || "1" },
            (node) =>
              chrome.runtime.lastError
                ? rej(chrome.runtime.lastError)
                : res(node)
          )
      );

      await chrome.bookmarks.move(activeDragItem.id, {
        parentId: newFolder.id,
      });
      await chrome.bookmarks.move(dropTarget.id, {
        parentId: newFolder.id,
        index: 1,
      });

      window.location.reload();
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setShowFolderForm(false);
    }
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
      >
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 justify-items-center">
            {bookmarks.map((bm) =>
              bm.url ? (
                <BookmarkItem
                  key={bm.id}
                  bookmark={bm}
                  isDragActive={!!activeDragItem}
                />
              ) : (
                <FolderPreview
                  key={bm.id}
                  folder={bm}
                  openFolder={openFolder}
                />
              )
            )}
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
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-blue-500 transform scale-110 transition-transform">
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

      {showFolderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-80">
            <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
            <input
              type="text"
              autoFocus
              placeholder="Folder name"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 dark:bg-gray-700 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateFolder((e.target as HTMLInputElement).value);
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                onClick={() => setShowFolderForm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => {
                  const input = document.querySelector("input");
                  if (input)
                    handleCreateFolder((input as HTMLInputElement).value);
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkGrid;
