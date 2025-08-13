import React, { useState } from "react";
import { createFolder } from "../../../utils/api";
import ImportForm from "./ImportForm";

interface GridHeaderProps {
  folderId: string;
  folder: any;
  depth: number;
}

const GridHeader: React.FC<GridHeaderProps> = ({ folderId, folder, depth }) => {
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

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
      <h3 className="grid-header-title text-xl font-semibold text-text-primary">
        {folder?.title || "All Bookmarks"}
      </h3>

      {/* Hide header actions for the temporary folder placeholder */}
      {folder?.id !== "temp" && (
        <div className="grid-header-actions flex gap-2">
          <button
            className="px-4 py-2 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg"
            onClick={() => alert("Add bookmark form will open here")}
          >
            + Bookmark
          </button>

          <button
            className="px-4 py-2 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg"
            onClick={handleAddFolder}
          >
            + Folder
          </button>

          <div className="relative">
            <button
              className="px-4 py-2 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg"
              onClick={() => setShowImportDropdown(!showImportDropdown)}
            >
              + Import
            </button>

            {showImportDropdown && (
              <div className="import-dropdown absolute right-0 top-10 bg-dropdown-background rounded-md shadow-lg z-50 border min-w-[150px]">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover"
                  onClick={() => {
                    setShowImportForm(true);
                    setShowImportDropdown(false);
                  }}
                >
                  From Text
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showImportForm && (
        <ImportForm
          parentId={folderId}
          onClose={() => setShowImportForm(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default GridHeader;
