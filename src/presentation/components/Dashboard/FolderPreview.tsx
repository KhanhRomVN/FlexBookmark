import React from "react";
import { BookmarkNode } from "../../tab/Dashboard";
import { useDraggable, useDroppable } from "@dnd-kit/core";

interface FolderPreviewProps {
  folder: BookmarkNode;
  openFolder: (folder: BookmarkNode) => void;
}

const FolderPreview: React.FC<FolderPreviewProps> = ({
  folder,
  openFolder,
}) => {
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

  return (
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
        } ${
          isOver
            ? "ring-2 ring-green-500 rounded-xl bg-green-50/50 dark:bg-green-900/30 shadow-lg scale-105"
            : ""
        }`}
      >
        <button
          className={`w-full flex flex-col items-center p-3 focus:outline-none transition-all duration-200 ${
            !isDragging && !isOver
              ? "hover:scale-105 hover:bg-white/20 dark:hover:bg-black/10 rounded-xl"
              : ""
          }`}
          onClick={(e) => {
            // Prevent folder opening if we're in drag mode or hovering for drop
            if (isDragging || isOver) {
              e.preventDefault();
              return;
            }
            openFolder(folder);
          }}
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          {...listeners}
          {...attributes}
        >
          <div
            className={`relative w-16 h-16 rounded-xl overflow-hidden shadow-md grid grid-cols-2 grid-rows-2 gap-0.5 transition-all duration-200 ${
              isOver ? "shadow-xl ring-2 ring-green-400" : ""
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

            {/* Drop indicator overlay */}
            {isOver && (
              <div className="absolute inset-0 bg-green-400/30 rounded-xl flex items-center justify-center">
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Drop here
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 w-full text-sm text-bookmarkItem-text truncate text-center">
            {folder.title}
          </div>

          {/* Show item count */}
          <div className="text-xs opacity-60 mt-1">
            {folder.children?.length || 0} items
          </div>
        </button>
      </div>
    </div>
  );
};

export default FolderPreview;
