import React, { useState, useEffect } from "react";
import { createBookmark } from "../../utils/api";

interface PopupFormProps {
  folders: any[];
  selectedFolder: string | null;
}

const PopupForm: React.FC<PopupFormProps> = ({ folders, selectedFolder }) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        setTitle(tab.title || "");
        setUrl(tab.url || "");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFolder) {
      alert("Please select a folder");
      return;
    }

    setIsSubmitting(true);

    try {
      await createBookmark({
        parentId: selectedFolder,
        title,
        url,
      });
      alert("Bookmark added successfully!");
      window.close();
    } catch (error) {
      console.error("Error adding bookmark:", error);
      alert("Failed to add bookmark");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="popup-form">
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">URL</label>
        <input
          type="url"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Selected folder:{" "}
        {selectedFolder
          ? folders.find((f) => f.id === selectedFolder)?.title || "None"
          : "None"}
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span>
            Saving...
          </>
        ) : (
          <>
            <span>💾</span>
            Save Bookmark
          </>
        )}
      </button>
    </form>
  );
};

export default PopupForm;
