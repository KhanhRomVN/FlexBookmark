import React, { useState, useEffect } from "react";
import PopupForm from "./PopupForm";
import { getBookmarks } from "../../../utils/api";
import { Loader } from "lucide-react";

const Popup: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setIsLoading(true);
        const tree = await getBookmarks();
        setBookmarks(tree[0]?.children || []);
      } catch (error) {
        console.error("[Popup] error fetching bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookmarks();
  }, []);

  return (
    <div className="w-[340px] p-5 bg-drawer-background text-text-primary">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader className="animate-spin text-primary h-8 w-8 mb-3" />
          <p className="text-text-secondary">Loading bookmarks...</p>
        </div>
      ) : (
        <PopupForm
          folders={bookmarks}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />
      )}

      <div className="mt-6 pt-4 border-t border-border-default text-center text-xs text-text-secondary">
        <p>Bookmark added to your browser's bookmarks bar</p>
      </div>
    </div>
  );
};

export default Popup;
