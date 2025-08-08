import React, { useState } from "react";
import { createBookmark, createFolder } from "../../../utils/api";

interface ImportFormProps {
  parentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportForm: React.FC<ImportFormProps> = ({
  parentId,
  onClose,
  onSuccess,
}) => {
  const [importText, setImportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const segments = importText
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const segment of segments) {
        const [folderName, bookmarkStr = ""] = segment
          .split(/:(.*)/s)
          .map((s) => s.trim());
        let targetParent = parentId;

        if (folderName) {
          const children = await new Promise<any[]>((resolve) =>
            chrome.bookmarks.getChildren(parentId, resolve)
          );

          const existing = children.find(
            (c) => !c.url && c.title === folderName
          );
          if (existing) {
            targetParent = existing.id;
          } else {
            const newFolder = await createFolder({
              parentId,
              title: folderName,
            });
            targetParent = newFolder.id;
          }
        }

        const items = bookmarkStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        for (let i = 0; i < items.length; i += 2) {
          const title = items[i];
          const url = items[i + 1];
          if (title && url) {
            await createBookmark({ parentId: targetParent, title, url });
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error importing bookmarks:", error);
      alert("Failed to import bookmarks");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Import Bookmarks
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Format: "Folder: Title, URL, Title2, URL2; Folder2: Title, URL"
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white h-32"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Work: Docs, https://docs.com, Blog, https://blog.com; Personal: Github, https://github.com"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportForm;
