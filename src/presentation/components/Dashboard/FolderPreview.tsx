import React from "react";
import { BookmarkNode } from "../../tab/Dashboard";
import { useDraggable } from "@dnd-kit/core";

interface FolderPreviewProps {
  folder: BookmarkNode;
  openFolder: (folder: BookmarkNode) => void;
}

const FolderPreview: React.FC<FolderPreviewProps> = ({
  folder,
  openFolder,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: folder.id });
  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const previewItems = folder.children?.slice(0, 4) || [];
  const remainingCount = (folder.children?.length || 0) - previewItems.length;

  return (
    <div
      className={`relative transition-all ${
        isDragging ? "opacity-50 cursor-grabbing" : ""
      }`}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={`relative w-full ${
          isDragging ? "opacity-50 cursor-grabbing" : ""
        }`}
      >
        <button
          className="w-full flex flex-col items-center p-2 focus:outline-none"
          onClick={() => openFolder(folder)}
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          {...listeners}
          {...attributes}
        >
          <div
            className={`relative w-14 h-14 rounded-xl overflow-hidden shadow grid grid-cols-2 grid-rows-2 gap-0.5`}
          >
            {previewItems.map((item, i) => (
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
          <div className="mt-2 w-full text-xs text-bookmarkItem-text truncate">
            {folder.title}
          </div>
        </button>
      </div>
    </div>
  );
};

export default FolderPreview;
