import React from "react";
import { useTheme } from "../../providers/theme-provider";
import useWindowSize from "../../../hooks/useWindowSize";
import { useDashboardData } from "./useDashboardData";
import Clock from "../../components/Dashboard/Clock";
import WeatherWidget from "../../components/Dashboard/WeatherWidget";
import SearchBar from "../../components/Dashboard/SearchBar";
import BookmarkGrid from "../../components/Dashboard/BookmarkGrid";
import ThemeDrawer from "../../components/drawer/ThemeDrawer";
import BookmarkBarDrawer from "../../components/Dashboard/BookmarkBarDrawer";

const Dashboard: React.FC = () => {
  const windowSize = useWindowSize();
  const { theme } = useTheme();
  const {
    weather,
    searchQuery,
    setSearchQuery,
    handleSearch,
    filtered,
    currentFolder,
    folderHistory,
    openFolder,
    goBack,
    exitToRootFolder,
    barFolderId,
    loadBookmarks,
    currentPage,
    setCurrentPage,
    handleBookmarkEdit,
    handleBookmarkDelete,
    handleFolderRename,
    handleFolderDelete,
    handleAddBookmark,
  } = useDashboardData();

  const [showThemeDrawer, setShowThemeDrawer] = React.useState(false);
  const [showBookmarkDrawer, setShowBookmarkDrawer] = React.useState(false);

  return (
    <>
      <div
        className={`relative min-h-screen flex flex-col items-center justify-center text-text-primary ${
          theme !== "image" ? "bg-background" : ""
        }`}
      >
        {theme === "image" && (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "var(--bg-url)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(var(--bg-blur))",
              }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "var(--overlay-color)" }}
            />
          </>
        )}
        <div className="w-full max-w-6xl flex flex-col items-center relative z-10">
          <div className="w-full max-w-2xl flex flex-col items-center mb-8">
            <Clock />
            <WeatherWidget weather={weather} />
          </div>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            onOptionOne={() => setShowBookmarkDrawer(true)}
            onOptionTwo={() => setShowThemeDrawer(true)}
          />
          <BookmarkGrid
            bookmarks={filtered}
            currentFolder={currentFolder}
            folderHistory={folderHistory}
            openFolder={openFolder}
            goBack={goBack}
            exitToRootFolder={exitToRootFolder}
            barFolderId={barFolderId}
            loadBookmarks={loadBookmarks}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onBookmarkEdit={handleBookmarkEdit}
            onBookmarkDelete={handleBookmarkDelete}
            onFolderRename={handleFolderRename}
            onFolderDelete={handleFolderDelete}
            onAddBookmark={handleAddBookmark}
            key={windowSize.width}
          />
        </div>
      </div>
      <ThemeDrawer
        isOpen={showThemeDrawer}
        onClose={() => setShowThemeDrawer(false)}
      />
      <BookmarkBarDrawer
        isOpen={showBookmarkDrawer}
        onClose={() => setShowBookmarkDrawer(false)}
      />
    </>
  );
};

export default Dashboard;
