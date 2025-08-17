import React from "react";
import MainLayout from "../../components/layout/MainLayout";
import BookmarkLayout from "../../components/BookmarkManager/BookmarkLayout";
import BookmarkSearchLayout from "../../components/BookmarkManager/BookmarkSearchLayout";
import { useBookmarkManagerData } from "./useBookmarkManagerData";

const BookmarkManager: React.FC = () => {
  const {
    folders,
    selectedFolder,
    loading,
    searchQuery,
    onSelectFolder,
    onAddFolder,
    onBookmarkEdit,
  } = useBookmarkManagerData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainLayout
      folders={folders}
      onSelectFolder={onSelectFolder}
      onAddFolder={onAddFolder}
    >
      {searchQuery ? (
        <BookmarkSearchLayout
          searchQuery={searchQuery}
          folders={folders}
          onSelectFolder={onSelectFolder}
          onBookmarkEdit={onBookmarkEdit}
        />
      ) : (
        <BookmarkLayout folderId={selectedFolder} folders={folders} />
      )}
    </MainLayout>
  );
};

export default BookmarkManager;
