import React, { useState } from "react";
import { createFolder } from "../../../utils/api";

interface GridHeaderProps {
  folderId: string;
  folder: any;
  depth: number;
}

const GridHeader: React.FC<GridHeaderProps> = ({ folderId, folder, depth }) => {
  const [showImportDropdown, setShowImportDropdown] = useState(false);

  const handleAddFolder = async () => {
    if (depth >= 2) {
      alert("Cannot create folder beyond level 2");
      return;
    }

    const name = prompt("Enter folder name:");
    if (!name) return;

    await createFolder({ title: name, parentId: folderId });
    window.location.reload();
  };

  return (
    <div className="grid-header flex items-center justify-between mb-4">
      <h3 className="grid-header-title text-xl font-semibold text-gray-800 dark:text-white">
        {folder?.title || "All Bookmarks"}
      </h3>

      <div className="grid-header-actions flex gap-2">
        <button
          className="add-bookmark-btn-grid px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          onClick={() => alert("Add bookmark form will open here")}
        >
          + Bookmark
        </button>

        <button
          className="add-group-btn-grid px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          onClick={handleAddFolder}
        >
          + Folder
        </button>

        <div className="relative">
          <button
            className="import-btn-grid px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg"
            onClick={() => setShowImportDropdown(!showImportDropdown)}
          >
            + Import
          </button>

          {showImportDropdown && (
            <div className="import-dropdown absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 min-w-[150px]">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  alert("Text import form will open here");
                  setShowImportDropdown(false);
                }}
              >
                From Text
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GridHeader;
