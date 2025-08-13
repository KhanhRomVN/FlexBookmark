import React from "react";
import { BookmarkNode } from "../../tab/Dashboard";
import { useDraggable, useDroppable } from "@dnd-kit/core";

interface FolderPreviewProps {
  folder: BookmarkNode;
  openFolder: (folder: BookmarkNode) => void;
  /** highlight folder when gap hovered */
  isHighlighted?: boolean;
  /** side for highlight */
  position?: "left" | "right";
}

const FolderPreview: React.FC<FolderPreviewProps> = ({
  folder,
  openFolder,
  isHighlighted = false,
  position,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: dragRef,
    transform,
    isDragging,
  } = useDraggable({ id: folder.id });
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: folder.id });
  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const previewItems = folder.children?.slice(0, 4) || [];
  const remainingCount = (folder.children?.length || 0) - previewItems.length;

  return (
    <div
      ref={dropRef}
      className={`relative transition-all ${
        isHighlighted
          ? position === "left"
            ? "border-l-4 border-blue-500 ml-2"
            : "border-r-4 border-blue-500 mr-2"
          : ""
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 rounded-xl z-10 border-2 border-blue-500" />
      )}
      <div
        ref={dragRef}
        style={style}
        className={`relative w-full ${
          isOver ? "ring-2 ring-blue-500 rounded-lg" : ""
        }`}
      >
        <button
          className="w-full flex flex-col items-center p-2 group"
          onClick={() => openFolder(folder)}
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          {...listeners}
          {...attributes}
        >
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow grid grid-cols-2 grid-rows-2 gap-0.5">
            {previewItems.map((item, i) => (
              <div
                key={i}
                className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800"
              >
                {item.url ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${
                      new URL(item.url).hostname
                    }&sz=64`}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xl">📁</span>
                )}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-700 text-[10px] font-semibold p-1 rounded-full">
                +{remainingCount}
              </div>
            )}
          </div>
          <div className="mt-2 w-full text-xs text-center truncate">
            {folder.title}
          </div>
        </button>
      </div>
    </div>
  );
};

export default FolderPreview;
