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
    setNodeRef: dragRef,
    transform,
  } = useDraggable({
    id: folder.id,
  });
  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: folder.id,
  });
  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const previewItems = folder.children?.slice(0, 4) || [];
  const remainingCount = (folder.children?.length || 0) - previewItems.length;

  return (
    <div ref={dropRef}>
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
            {[0, 1, 2, 3].map((i) => {
              const item = previewItems[i];
              if (item) {
                return (
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
                );
              } else if (i === 3 && remainingCount > 0) {
                return (
                  <div
                    key={i}
                    className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-[10px] font-semibold"
                  >
                    +{remainingCount}
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="w-full h-full bg-gray-100 dark:bg-gray-700"
                />
              );
            })}
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
