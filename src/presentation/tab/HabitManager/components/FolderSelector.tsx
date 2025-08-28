import React, { useState, useEffect } from "react";
import {
  DriveFileManager,
  DriveFolder,
} from "../../../../utils/driveFileManager";

interface FolderSelectorProps {
  driveManager: DriveFileManager | null;
  onFolderSelected: (folderId: string, folderName: string) => void;
  onClose?: () => void;
}

interface FolderPath {
  id: string;
  name: string;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  driveManager,
  onFolderSelected,
  onClose,
}) => {
  // States for folder selection
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Folder navigation states
  const [currentFolders, setCurrentFolders] = useState<DriveFolder[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string>("root");
  const [folderPath, setFolderPath] = useState<FolderPath[]>([
    { id: "root", name: "My Drive" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  // Load folders from Google Drive API
  const loadFolders = async (
    parentId: string = "root",
    searchTerm: string = ""
  ) => {
    if (!driveManager) {
      setError("Drive manager not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const folders = await driveManager.listFolders(parentId, searchTerm);
      setCurrentFolders(folders);
    } catch (err) {
      console.error("Error loading folders:", err);
      setError(err instanceof Error ? err.message : "Failed to load folders");
      setCurrentFolders([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle folder navigation
  const handleFolderSelect = async (folder: DriveFolder) => {
    try {
      setLoading(true);
      // Check if this folder has subfolders by trying to load them
      const subfolders = await driveManager!.listFolders(folder.id);

      if (subfolders.length > 0) {
        // Navigate into folder
        setCurrentParentId(folder.id);
        setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
        setCurrentFolders(subfolders);
      }
    } catch (err) {
      console.error("Error checking subfolders:", err);
      // If error checking subfolders, treat as leaf folder
    } finally {
      setLoading(false);
    }
  };

  const handleBackToParent = () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1);
      const parentId = newPath[newPath.length - 1].id;
      setFolderPath(newPath);
      setCurrentParentId(parentId);
      loadFolders(parentId);
    }
  };

  const handleBreadcrumbClick = (targetFolder: FolderPath) => {
    const targetIndex = folderPath.findIndex((f) => f.id === targetFolder.id);
    if (targetIndex !== -1) {
      const newPath = folderPath.slice(0, targetIndex + 1);
      setFolderPath(newPath);
      setCurrentParentId(targetFolder.id);
      loadFolders(targetFolder.id);
    }
  };

  const handleChooseFolder = (folderId: string, folderName: string) => {
    onFolderSelected(folderId, folderName);
    setShowFolderDialog(false);
  };

  const handleCreateFlexBookmarkFolder = async () => {
    if (!driveManager) {
      setError("Drive manager not initialized");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Creating FlexBookmark folder in:", currentParentId);
      const folderId = await driveManager.createFlexBookmarkFolder(
        currentParentId
      );

      // Auto-select the created folder
      onFolderSelected(folderId, "FlexBookmark");
      setShowCreateFolderDialog(false);
    } catch (err) {
      console.error("Error creating FlexBookmark folder:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create FlexBookmark folder"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load initial folders when dialog opens
  useEffect(() => {
    if (showFolderDialog && driveManager) {
      loadFolders(currentParentId);
    }
  }, [showFolderDialog, currentParentId, driveManager]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!showFolderDialog) {
      setSearchQuery("");
      setCurrentParentId("root");
      setFolderPath([{ id: "root", name: "My Drive" }]);
    }
  }, [showFolderDialog]);

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    if (driveManager) {
      loadFolders(currentParentId, searchTerm);
    }
  };

  if (!driveManager) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200">
        <p className="text-red-600">
          Drive manager not initialized. Please authenticate first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
        <div className="relative mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center shadow-xl">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Chọn thư mục FlexBookmark
        </h3>

        <p className="text-slate-600 mb-8 leading-relaxed">
          Vui lòng chọn thư mục FlexBookmark hiện có hoặc tạo mới để lưu trữ dữ
          liệu thói quen
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => setShowFolderDialog(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              )}
              Chọn thư mục có sẵn
            </div>
          </button>

          <button
            onClick={() => setShowCreateFolderDialog(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              )}
              Tạo thư mục FlexBookmark
            </div>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full text-slate-600 hover:text-slate-800 font-medium py-2 px-4 transition-colors"
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* Folder Selection Dialog */}
      {showFolderDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900">
                  Chọn thư mục FlexBookmark từ Google Drive
                </h3>
                <button
                  onClick={() => setShowFolderDialog(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm kiếm thư mục FlexBookmark..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mt-4 text-sm">
                {folderPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <button
                      onClick={() => handleBreadcrumbClick(folder)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {folder.name}
                    </button>
                    {index < folderPath.length - 1 && (
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Back button */}
              {folderPath.length > 1 && (
                <button
                  onClick={handleBackToParent}
                  className="flex items-center gap-3 p-3 w-full text-left hover:bg-slate-50 rounded-lg transition-colors mb-2"
                >
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span className="text-slate-600">
                    .. (Trở lại thư mục cha)
                  </span>
                </button>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-slate-600">
                    Đang tải từ Google Drive...
                  </span>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.892-.833-2.664 0L3.133 16.5C2.364 18.167 3.326 19 4.866 19z"
                      />
                    </svg>
                  </div>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => loadFolders(currentParentId, searchQuery)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && currentFolders.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600">Không tìm thấy thư mục nào</p>
                </div>
              )}

              {/* Folder list */}
              {!loading && !error && currentFolders.length > 0 && (
                <div className="space-y-2">
                  {currentFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <button
                        onClick={() => handleFolderSelect(folder)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        <span className="text-slate-900 font-medium">
                          {folder.name}
                        </span>
                      </button>

                      {/* Show select button for FlexBookmark folders */}
                      {folder.name.toLowerCase().includes("flexbookmark") && (
                        <button
                          onClick={() =>
                            handleChooseFolder(folder.id, folder.name)
                          }
                          className="ml-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium transition-colors"
                        >
                          Chọn
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600 text-center">
                Tìm kiếm hoặc điều hướng đến thư mục FlexBookmark trong Google
                Drive của bạn
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create FlexBookmark Folder Dialog */}
      {showCreateFolderDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Tạo thư mục FlexBookmark
              </h3>

              <div className="space-y-4">
                {/* Fixed folder name display */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tên thư mục
                  </label>
                  <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600">
                    FlexBookmark
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tên thư mục cố định cho hệ thống quản lý thói quen
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vị trí tạo
                  </label>
                  <button
                    onClick={() => {
                      setShowCreateFolderDialog(false);
                      setShowFolderDialog(true);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-left text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {folderPath[folderPath.length - 1].name} (click để thay đổi)
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateFolderDialog(false)}
                  disabled={loading}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateFlexBookmarkFolder}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {loading ? "Đang tạo..." : "Tạo thư mục FlexBookmark"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSelector;
