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
      const lines = importText.split("\n");
      for (const line of lines) {
        const [title, url] = line.split(",");
        if (title && url) {
          await createBookmark({
            parentId,
            title: title.trim(),
            url: url.trim(),
          });
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error importing bookmarks:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dialog-background rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Import Bookmarks</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">
              Paste bookmarks (Title,URL per line):
            </label>
            <textarea
              className="w-full h-40 p-2 border border-border-default rounded bg-input-background text-text-primary"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Google,https://google.com\nFacebook,https://facebook.com"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-button-secondBg rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-button-bg text-text-primary rounded"
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
