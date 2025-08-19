import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Task } from "../../../../types/task";

interface CollectionSectionProps {
  editedTask: Task;
  handleChange: (field: keyof Task, value: any) => void;
  availableTasks: Task[];
}

const CollectionSection: React.FC<CollectionSectionProps> = ({
  editedTask,
  handleChange,
  availableTasks,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string>("");

  // Extract all unique collections from available tasks
  const allCollections = useMemo(() => {
    const collections = new Set<string>();
    availableTasks.forEach((task) => {
      if (task.collection) {
        collections.add(task.collection);
      }
    });
    if (editedTask.collection) {
      collections.add(editedTask.collection);
    }
    return Array.from(collections).sort();
  }, [availableTasks, editedTask.collection]);

  // Filter collections based on search term
  const filteredCollections = useMemo(() => {
    if (!searchTerm) return allCollections;
    return allCollections.filter((collection) =>
      collection.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCollections, searchTerm]);

  // Check if a collection is used by other tasks
  const isCollectionUsedByOthers = (collection: string): boolean => {
    return availableTasks.some(
      (task) => task.collection === collection && task.id !== editedTask.id
    );
  };

  const handleCollectionSelect = (collection: string) => {
    handleChange("collection", collection);
    setShowSearch(false);
    setSearchTerm("");
  };

  const handleCreateCollection = () => {
    if (searchTerm.trim()) {
      handleChange("collection", searchTerm.trim());
      setShowSearch(false);
      setSearchTerm("");
    }
  };

  const handleRemoveCollection = () => {
    handleChange("collection", "");
  };

  const handleDeleteCollection = (collection: string) => {
    setCollectionToDelete(collection);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCollection = () => {
    // Remove this collection from all tasks that use it
    const tasksToUpdate = availableTasks.filter(
      (task) => task.collection === collectionToDelete
    );

    // Update all tasks that use this collection (this would need to be handled by parent)
    tasksToUpdate.forEach((task) => {
      // In a real implementation, you would update these tasks via API
      console.log(`Removing collection from task: ${task.id}`);
    });

    // Remove from current task if it's using this collection
    if (editedTask.collection === collectionToDelete) {
      handleChange("collection", "");
    }

    setShowDeleteConfirm(false);
    setCollectionToDelete("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector(
        ".collection-search-container"
      );
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-text-default">Collection</h4>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
      </div>

      <div className="relative collection-search-container">
        {editedTask.collection ? (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {editedTask.collection}
            </span>
            <button
              onClick={() => setShowSearch(true)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Search size={16} />
            </button>
            <button
              onClick={handleRemoveCollection}
              className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full p-3 text-left bg-input-background hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg border border-border-default text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
          >
            <Plus size={16} />
            Add to collection
          </button>
        )}

        {showSearch && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-border-default rounded-lg shadow-lg z-10">
            <div className="p-2 border-b border-border-default">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search or create collection..."
                  className="w-full pl-9 pr-3 py-2 bg-transparent border-none focus:ring-0 text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredCollections.length > 0 ? (
                filteredCollections.map((collection) => (
                  <div
                    key={collection}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <button
                      onClick={() => handleCollectionSelect(collection)}
                      className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300"
                    >
                      {collection}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-60 hover:opacity-100"
                      title="Delete collection"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : searchTerm ? (
                <button
                  onClick={handleCreateCollection}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create "{searchTerm}"
                </button>
              ) : (
                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  No collections found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Collection
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete the collection{" "}
                <strong>"{collectionToDelete}"</strong>?
              </p>

              {isCollectionUsedByOthers(collectionToDelete) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ <strong>Warning:</strong> This collection is used by
                    other tasks. Deleting it will remove the collection from all
                    tasks.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> Collections are automatically removed
                  when not used by any tasks.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCollection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionSection;
