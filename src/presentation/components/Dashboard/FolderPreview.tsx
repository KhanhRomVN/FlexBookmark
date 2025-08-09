import React from "react";
import { BookmarkNode } from "../../tab/Dashboard";

interface FolderPreviewProps {
  folder: BookmarkNode;
  openFolder: (folder: BookmarkNode) => void;
}

const FolderPreview: React.FC<FolderPreviewProps> = ({
  folder,
  openFolder,
}) => {
  const previewItems = folder.children?.slice(0, 4) || [];
  const remainingCount = (folder.children?.length || 0) - previewItems.length;

  return (
    <button
      className="w-full flex flex-col items-center p-2 group"
      onClick={() => openFolder(folder)}
    >
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow flex items-center justify-center group-hover:shadow-lg transition-all">
          <span className="text-xl">📁</span>
        </div>

        {previewItems.length > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow border border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-0.5">
            {previewItems.map((item, index) => (
              <div
                key={index}
                className="w-3 h-3 flex items-center justify-center"
              >
                {item.url ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${
                      new URL(item.url).hostname
                    }&sz=32`}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[8px]">📁</span>
                )}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded text-[6px] flex items-center justify-center">
                +{remainingCount}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 w-full text-xs text-center truncate">
        {folder.title}
      </div>
    </button>
  );
};

export default FolderPreview;
