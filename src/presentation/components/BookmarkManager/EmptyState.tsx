import React from "react";

const EmptyState: React.FC = () => {
  return (
    <div className="empty-state flex flex-col items-center justify-center text-center p-8 text-gray-500 dark:text-gray-400">
      <div className="empty-icon text-5xl mb-4">📚</div>
      <p className="text-lg">There are no bookmarks in this folder.</p>
    </div>
  );
};

export default EmptyState;
