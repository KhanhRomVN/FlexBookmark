import React, { useState, useRef, useEffect } from "react";
import { BookmarkNode } from "../../types/bookmark";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import BookmarkForm from "../BookmarkManager/BookmarkForm";

interface FolderPreviewProps {
  folder: BookmarkNode;
  openFolder: (folder: BookmarkNode) => void;
  onRename?: (folderId: string, newTitle: string) => void;
  onDelete?: (folderId: string, moveBookmarksOut: boolean) => void;
  onAddBookmark?: (folderId: string) => void;
}

const FolderPreview: React.FC<FolderPreviewProps> = ({
  folder,
  openFolder,
  onRename,
  onDelete,
  onAddBookmark,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleRename = () => {
    setShowContextMenu(false);
    const newTitle = prompt("Enter new folder name:", folder.title);
    if (newTitle && newTitle.trim()) {
      onRename?.(folder.id, newTitle.trim());
    }
  };

  const handleAddBookmark = () => {
    setShowContextMenu(false);
    setShowAddForm(true);
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    // Call the onAddBookmark callback to refresh bookmarks
    onAddBookmark?.(folder.id);
  };

  const handleDelete = async () => {
    setShowContextMenu(false);
    const hasBookmarks = folder.children && folder.children.length > 0;

    if (hasBookmarks) {
      const moveOut = confirm(
        `Folder "${folder.title}" contains ${
          folder.children!.length
        } bookmark(s). Would you like to move them out before deleting the folder?\n\nClick OK to move bookmarks out, or Cancel to delete everything.`
      );
      onDelete?.(folder.id, moveOut);
    } else {
      if (confirm(`Delete empty folder "${folder.title}"?`)) {
        onDelete?.(folder.id, false);
      }
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: folder.id });

  // Add droppable for accepting bookmarks into folder
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: folder.id,
  });

  const style: React.CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        visibility: isDragging ? "hidden" : "visible",
      }
    : { visibility: isDragging ? "hidden" : "visible" };

  const previewItems = folder.children?.slice(0, 4) || [];
  const remainingCount = (folder.children?.length || 0) - previewItems.length;

  // Combine refs
  const combinedRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  // Truncate title to match BookmarkItem behavior
  const truncatedTitle =
    folder.title.length > 10
      ? `${folder.title.substring(0, 10)}...`
      : folder.title;

  return (
    <>
      <div
        className={`relative transition-all duration-200 ${
          isDragging ? "opacity-50 cursor-grabbing" : ""
        }`}
      >
        <div
          ref={combinedRef}
          style={style}
          className={`relative w-full transition-all duration-200 ${
            isDragging ? "opacity-50 cursor-grabbing" : ""
          }`}
          onContextMenu={handleContextMenu}
        >
          <button
            className={`w-full flex flex-col items-center p-3 focus:outline-none transition-all duration-200 ${
              !isDragging && !isOver
                ? "hover:scale-105 hover:bg-button-secondBg rounded-xl"
                : ""
            }`}
            onClick={(e) => {
              // Prevent folder opening if we're in drag mode or hovering for drop or showing context menu
              if (isDragging || isOver || showContextMenu) {
                e.preventDefault();
                return;
              }
              openFolder(folder);
            }}
            onMouseDown={(e) => {
              // Prevent drag start when right-clicking
              if (e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
            }}
            // Only apply drag listeners when not right-clicking
            {...(showContextMenu ? {} : listeners)}
            {...(showContextMenu ? {} : attributes)}
          >
            <div
              className={`relative w-16 h-16 rounded-xl overflow-hidden grid grid-cols-2 grid-rows-2 gap-[4px] p-[4px] transition-all duration-200 ${
                isOver ? "ring-2 ring-green-400" : ""
              }`}
            >
              {previewItems.length > 0
                ? previewItems.map((item, i) => (
                    <div
                      key={i}
                      className="w-full h-full flex items-center justify-center bg-bookmarkItem-bg"
                    >
                      {item.url ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${
                            new URL(item.url).hostname
                          }&sz=64`}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to generic icon
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNEg0NFY0MEgyMFYyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                          }}
                        />
                      ) : (
                        <span className="text-sm">📁</span>
                      )}
                    </div>
                  ))
                : // Empty folder - show placeholder grid
                  Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                    >
                      <span className="text-xs opacity-50">📁</span>
                    </div>
                  ))}

              {/* Show remaining count if there are more items */}
              {remainingCount > 0 && (
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center shadow-lg">
                  +{remainingCount}
                </div>
              )}
            </div>

            <div className="mt-1 w-16 text-sm text-bookmarkItem-text truncate text-center">
              {truncatedTitle}
            </div>
          </button>
        </div>

        {/* Context Menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 z-50 min-w-[140px] backdrop-blur-sm"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              onClick={handleRename}
            >
              <span>✏️</span>
              Rename
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              onClick={handleAddBookmark}
            >
              <span>➕</span>
              Add Bookmark
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
              onClick={handleDelete}
            >
              <span>🗑️</span>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Add Bookmark Form */}
      {showAddForm && (
        <BookmarkForm
          parentId={folder.id}
          onClose={() => setShowAddForm(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </>
  );
};

export default FolderPreview;
