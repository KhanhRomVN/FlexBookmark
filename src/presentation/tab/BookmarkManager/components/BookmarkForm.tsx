import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../../providers/theme-provider";
import { createBookmark } from "../../../../utils/api";

interface BookmarkFormProps {
  parentId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    title: string;
    url: string;
  };
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({
  parentId,
  onClose,
  onSuccess,
  initialData,
}) => {
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // focus title input when modal opens
    titleRef.current?.focus();
    // prevent background scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  const [title, setTitle] = useState(initialData?.title || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, imageThemeSettings } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createBookmark({
        parentId,
        title,
        url,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating bookmark:", error);
      alert("Failed to create bookmark");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={
        theme === "image"
          ? {
              backgroundColor: `rgba(0,0,0,${
                imageThemeSettings.bmOverlayOpacity / 100
              })`,
            }
          : { backgroundColor: "rgba(0,0,0,0.5)" }
      }
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      tabIndex={-1}
    >
      <div
        className="bg-dialog-background rounded-lg p-4 w-full max-w-md"
        style={
          theme === "image"
            ? {
                backgroundColor: `rgba(0,0,0,${
                  imageThemeSettings.bmDialogOpacity / 100
                })`,
              }
            : undefined
        }
      >
        <h2 className="text-xl font-bold mb-4 text-text-primary">
          {initialData ? "Edit Bookmark" : "Add Bookmark"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-text-secondary mb-2">Title</label>
            <input
              ref={titleRef}
              type="text"
              placeholder="Enter a title"
              className="w-full px-3 py-2 border border-border-default rounded-md bg-input-background text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-text-secondary mb-2">URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-border-default rounded-md bg-dialog-background text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-button-secondBg hover:bg-button-secondBgHover text-text-primary rounded-md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !title.trim() || !url.trim()}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookmarkForm;
