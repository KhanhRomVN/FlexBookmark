import React, { useState, useEffect } from "react";
import { createBookmark } from "../../../utils/api";
import { Folder } from "lucide-react";
import FolderTree from "./FolderTree";

interface PopupFormProps {
  folders: any[];
  selectedFolder: string | null;
  onSelectFolder: (id: string) => void;
}

const PopupForm: React.FC<PopupFormProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
}) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  useEffect(() => {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs: chrome.tabs.Tab[]) => {
        const tab = tabs[0];
        if (tab) {
          setTitle(tab.title || "");
          setUrl(tab.url || "");
        }
      }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolder) {
      setShowFolderSelector(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await createBookmark({ parentId: selectedFolder, title, url });
      window.alert("Bookmark added successfully!");
      window.close();
    } catch (error) {
      console.error("Error adding bookmark:", error);
      window.alert("Failed to add bookmark");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedFolderName = (): string => {
    if (!selectedFolder) return "Select folder";
    const folder = folders.find((f) => f.id === selectedFolder);
    return folder ? folder.title : "Unknown folder";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-primary">Add Bookmark</h2>
        <button
          type="button"
          onClick={() => window.close()}
          className="p-1 rounded-full hover:bg-button-second-bg-hover transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-text-secondary"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-secondary">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-input-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* URL Input */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-secondary">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-input-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Save Bookmark Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all ${
            isSubmitting
              ? "bg-primary/80 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Save Bookmark</span>
            </>
          )}
        </button>

        {/* Folder Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFolderSelector((prev) => !prev)}
            className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg transition-colors ${
              selectedFolder
                ? "bg-primary/10 border-primary text-primary"
                : "bg-input-background border-border-default text-text-primary"
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder size={16} />
              <span>{getSelectedFolderName()}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showFolderSelector && (
            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto border border-border-default rounded-lg bg-dropdown-background shadow-lg">
              <FolderTree
                folders={folders}
                selectedFolderId={selectedFolder}
                onSelectFolder={(id) => {
                  onSelectFolder(id);
                  setShowFolderSelector(false);
                }}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PopupForm;
