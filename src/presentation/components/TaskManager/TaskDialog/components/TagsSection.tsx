import React from "react";
import { Plus, X } from "lucide-react";

interface TagsSectionProps {
  editedTask: { tags?: string[] };
  newTag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => void;
  handleDeleteTag: (tag: string) => void;
}

const TagsSection: React.FC<TagsSectionProps> = ({
  editedTask,
  newTag,
  setNewTag,
  handleAddTag,
  handleDeleteTag,
}) => {
  return (
    <div>
      <label className="block mb-3 text-sm font-medium text-text-secondary">
        Tags
      </label>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {editedTask?.tags?.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium"
            >
              {tag}
              <button
                onClick={() => handleDeleteTag(tag)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-border-default text-text-default text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
          />
          <button
            onClick={handleAddTag}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagsSection;
