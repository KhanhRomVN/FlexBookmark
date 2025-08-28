import React, { useState, useEffect } from "react";

// Mock interfaces for demo
interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  currentCount: number;
  createdAt: Date;
  color?: string;
}

interface HabitLog {
  date: string;
  habitId: string;
  completed: boolean;
  note?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
  webViewLink?: string;
}

// Mock auth state
const mockAuthState = {
  isAuthenticated: true,
  user: { name: "User", accessToken: "mock-token" },
  loading: false,
  error: null,
};

const HabitManager: React.FC = () => {
  // Mock data states
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Folder selection states
  const [needsFolderSelection, setNeedsFolderSelection] = useState(true);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");
  const [currentFolders, setCurrentFolders] = useState<DriveFolder[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string>("root");
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "My Drive" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  // Remove newFolderName state as we'll use fixed "FlexBookmark" name

  // Habit management states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    name: "",
    description: "",
    frequency: "daily",
    targetCount: 1,
    color: "#3b82f6",
  });

  // Mock folders data
  const mockFolders: { [key: string]: DriveFolder[] } = {
    root: [
      { id: "folder1", name: "Documents" },
      { id: "folder2", name: "Projects" },
      { id: "folder3", name: "FlexBookmark" },
      { id: "folder4", name: "Work Files" },
      { id: "folder5", name: "Personal" },
    ],
    folder1: [
      { id: "folder1_1", name: "Archive" },
      { id: "folder1_2", name: "Templates" },
    ],
    folder2: [
      { id: "folder2_1", name: "Web Development" },
      { id: "folder2_2", name: "Mobile Apps" },
    ],
    folder4: [
      { id: "folder4_1", name: "Reports" },
      { id: "folder4_2", name: "Presentations" },
    ],
  };

  // Get current date stats
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayLogs = habitLogs.filter((log) => log.date === todayStr);
  const completedToday = todayLogs.filter((log) => log.completed).length;

  // Mock functions
  const handleLogin = () => console.log("Login");
  const handleLogout = () => console.log("Logout");
  const handleRefresh = () => console.log("Refresh");

  const loadFolders = (parentId: string = "root", searchTerm: string = "") => {
    setLoading(true);

    setTimeout(() => {
      let folders = mockFolders[parentId] || [];

      if (searchTerm) {
        // Search across all folders, not just current level
        const allFolders = Object.values(mockFolders).flat();
        folders = allFolders.filter((f) =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setCurrentFolders(folders);
      setLoading(false);
    }, 300);
  };

  const handleFolderSelect = (folder: DriveFolder) => {
    // Check if this folder has subfolders
    if (mockFolders[folder.id]) {
      // Navigate into folder
      setCurrentParentId(folder.id);
      setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
      loadFolders(folder.id);
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

  const handleBreadcrumbClick = (targetFolder: {
    id: string;
    name: string;
  }) => {
    const targetIndex = folderPath.findIndex((f) => f.id === targetFolder.id);
    if (targetIndex !== -1) {
      const newPath = folderPath.slice(0, targetIndex + 1);
      setFolderPath(newPath);
      setCurrentParentId(targetFolder.id);
      loadFolders(targetFolder.id);
    }
  };

  const handleChooseFolder = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    setShowFolderDialog(false);
    setNeedsFolderSelection(false);

    // Mock: Check if habit sheet exists for current month
    console.log("Selected folder:", folderId, folderName);
    console.log("Checking for existing habit sheet...");

    // Simulate initialization
    setTimeout(() => {
      console.log("Habit structure initialized");
      // Initialize with some mock data
      setHabits([
        {
          id: "1",
          name: "Đọc sách",
          description: "Đọc sách 30 phút mỗi ngày",
          frequency: "daily",
          targetCount: 1,
          currentCount: 0,
          createdAt: new Date(),
          color: "#3b82f6",
        },
        {
          id: "2",
          name: "Tập thể dục",
          description: "Tập thể dục 45 phút",
          frequency: "daily",
          targetCount: 1,
          currentCount: 0,
          createdAt: new Date(),
          color: "#ef4444",
        },
      ]);
    }, 1000);
  };

  const handleCreateFolder = () => {
    // Fixed folder name - always "FlexBookmark"
    const folderName = "FlexBookmark";
    const currentLocation = folderPath[folderPath.length - 1];

    console.log(`Creating "${folderName}" folder in:`, currentLocation);

    // Mock folder creation
    const newFolder: DriveFolder = {
      id: `folder_${Date.now()}`,
      name: folderName,
    };

    // Add to current folders
    setCurrentFolders([...currentFolders, newFolder]);

    // Automatically select the new FlexBookmark folder
    console.log("Created FlexBookmark folder, auto-selecting...");
    handleChooseFolder(newFolder.id, newFolder.name);

    setShowCreateFolderDialog(false);
  };

  const handleCreateSubmit = async () => {
    if (!newHabit.name?.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabit.name,
      description: newHabit.description,
      frequency: newHabit.frequency as "daily" | "weekly" | "monthly",
      targetCount: newHabit.targetCount || 1,
      currentCount: 0,
      createdAt: new Date(),
      color: newHabit.color,
    };

    setHabits([...habits, habit]);
    setNewHabit({
      name: "",
      description: "",
      frequency: "daily",
      targetCount: 1,
      color: "#3b82f6",
    });
    setIsCreateDialogOpen(false);
  };

  const handleToggleHabit = (habitId: string) => {
    const existingLog = todayLogs.find((log) => log.habitId === habitId);
    const newLog: HabitLog = {
      date: todayStr,
      habitId,
      completed: !existingLog?.completed,
    };

    if (existingLog) {
      setHabitLogs(
        habitLogs.map((log) =>
          log.date === todayStr && log.habitId === habitId ? newLog : log
        )
      );
    } else {
      setHabitLogs([...habitLogs, newLog]);
    }

    // Update habit current count
    setHabits(
      habits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              currentCount: newLog.completed
                ? habit.currentCount + 1
                : Math.max(0, habit.currentCount - 1),
            }
          : habit
      )
    );
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(habits.filter((h) => h.id !== habitId));
    setHabitLogs(habitLogs.filter((l) => l.habitId !== habitId));
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(habits.map((h) => (h.id === updatedHabit.id ? updatedHabit : h)));
    setEditingHabit(null);
  };

  useEffect(() => {
    if (showFolderDialog) {
      loadFolders(currentParentId);
    }
  }, [showFolderDialog, currentParentId]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!showFolderDialog) {
      setSearchQuery("");
      setCurrentParentId("root");
      setFolderPath([{ id: "root", name: "My Drive" }]);
    }
  }, [showFolderDialog]);

  // Show folder selection if needed
  if (needsFolderSelection) {
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
            Vui lòng chọn thư mục FlexBookmark hiện có hoặc tạo mới để lưu trữ
            dữ liệu thói quen
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowFolderDialog(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-3">
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
                Chọn thư mục có sẵn
              </div>
            </button>

            <button
              onClick={() => setShowCreateFolderDialog(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-3">
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
                Tạo thư mục FlexBookmark
              </div>
            </button>
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
                    Chọn thư mục FlexBookmark
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
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      loadFolders(currentParentId, e.target.value);
                    }}
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

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-slate-600">Đang tải...</span>
                  </div>
                ) : currentFolders.length === 0 ? (
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
                ) : (
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
                  Tìm kiếm hoặc điều hướng đến thư mục FlexBookmark để tiếp tục
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Dialog - Simplified without name input */}
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
                      {folderPath[folderPath.length - 1].name} (click để thay
                      đổi)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateFolderDialog(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Tạo thư mục FlexBookmark
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Quản lý Thói quen
                </h1>
                <p className="text-sm text-slate-500">
                  {selectedFolderName && `📁 ${selectedFolderName}`}
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="group relative p-2.5 text-slate-600 hover:text-green-600 transition-all duration-200 rounded-xl hover:bg-green-50 disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  loading ? "animate-spin" : "group-hover:rotate-180"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              onClick={() => setNeedsFolderSelection(true)}
              className="group p-2.5 text-blue-600 hover:text-blue-700 transition-all duration-200 rounded-xl hover:bg-blue-50"
              title="Chọn thư mục lưu trữ"
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
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
            </button>

            <button
              onClick={handleLogout}
              className="group p-2.5 text-red-600 hover:text-red-700 transition-all duration-200 rounded-xl hover:bg-red-50"
              title="Đăng xuất"
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {habits.length}
                </p>
                <p className="text-sm text-slate-600">Tổng thói quen</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {completedToday}
                </p>
                <p className="text-sm text-slate-600">Hoàn thành hôm nay</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {habits.length - completedToday}
                </p>
                <p className="text-sm text-slate-600">Còn lại hôm nay</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {habits.length > 0
                    ? Math.round((completedToday / habits.length) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-slate-600">Tỉ lệ hoàn thành</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Thói quen của bạn
            </h2>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-4 h-4"
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
              Thêm thói quen
            </button>
          </div>

          {/* Habits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const todayLog = todayLogs.find(
                (log) => log.habitId === habit.id
              );
              const isCompleted = todayLog?.completed || false;

              return (
                <div
                  key={habit.id}
                  className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      ></div>
                      <h3 className="font-semibold text-slate-900">
                        {habit.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {habit.description && (
                    <p className="text-sm text-slate-600 mb-4">
                      {habit.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-slate-500">
                      <span className="capitalize">
                        {habit.frequency === "daily"
                          ? "Hàng ngày"
                          : habit.frequency === "weekly"
                          ? "Hàng tuần"
                          : "Hàng tháng"}
                      </span>
                      {habit.targetCount > 1 && ` • ${habit.targetCount} lần`}
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                      {habit.currentCount}/{habit.targetCount}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                      isCompleted
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isCompleted ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                  </button>
                </div>
              );
            })}

            {habits.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Chưa có thói quen nào
                </h3>
                <p className="text-slate-600 mb-4">
                  Hãy tạo thói quen đầu tiên để bắt đầu hành trình cải thiện bản
                  thân
                </p>
                <button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  <svg
                    className="w-4 h-4"
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
                  Tạo thói quen đầu tiên
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Habit Dialog */}
      {(isCreateDialogOpen || editingHabit) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingHabit ? "Chỉnh sửa thói quen" : "Tạo thói quen mới"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên thói quen
                </label>
                <input
                  type="text"
                  value={editingHabit ? editingHabit.name : newHabit.name}
                  onChange={(e) => {
                    if (editingHabit) {
                      setEditingHabit({
                        ...editingHabit,
                        name: e.target.value,
                      });
                    } else {
                      setNewHabit({ ...newHabit, name: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ví dụ: Đọc sách 30 phút"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={
                    editingHabit
                      ? editingHabit.description
                      : newHabit.description
                  }
                  onChange={(e) => {
                    if (editingHabit) {
                      setEditingHabit({
                        ...editingHabit,
                        description: e.target.value,
                      });
                    } else {
                      setNewHabit({ ...newHabit, description: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Mô tả chi tiết về thói quen..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tần suất
                  </label>
                  <select
                    value={
                      editingHabit ? editingHabit.frequency : newHabit.frequency
                    }
                    onChange={(e) => {
                      const frequency = e.target.value as
                        | "daily"
                        | "weekly"
                        | "monthly";
                      if (editingHabit) {
                        setEditingHabit({ ...editingHabit, frequency });
                      } else {
                        setNewHabit({ ...newHabit, frequency });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số lần mục tiêu
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={
                      editingHabit
                        ? editingHabit.targetCount
                        : newHabit.targetCount
                    }
                    onChange={(e) => {
                      const targetCount = parseInt(e.target.value) || 1;
                      if (editingHabit) {
                        setEditingHabit({ ...editingHabit, targetCount });
                      } else {
                        setNewHabit({ ...newHabit, targetCount });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Màu sắc
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingHabit ? editingHabit.color : newHabit.color}
                    onChange={(e) => {
                      if (editingHabit) {
                        setEditingHabit({
                          ...editingHabit,
                          color: e.target.value,
                        });
                      } else {
                        setNewHabit({ ...newHabit, color: e.target.value });
                      }
                    }}
                    className="w-12 h-8 border border-slate-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">
                    Chọn màu đại diện cho thói quen
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingHabit(null);
                  setNewHabit({
                    name: "",
                    description: "",
                    frequency: "daily",
                    targetCount: 1,
                    color: "#3b82f6",
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={
                  editingHabit
                    ? () => handleUpdateHabit(editingHabit)
                    : handleCreateSubmit
                }
                disabled={
                  !(editingHabit?.name?.trim() || newHabit.name?.trim())
                }
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {editingHabit ? "Cập nhật" : "Tạo thói quen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitManager;
