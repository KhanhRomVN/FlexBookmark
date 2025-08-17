import React from "react";

interface TaskGroup {
  id: string;
  title: string;
}

interface SidebarProps {
  groups: TaskGroup[];
  activeGroup: string;
  onSelectGroup: (id: string) => void;
  onCreateGroup: () => void;
}

const TaskGroupSidebar: React.FC<SidebarProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  onCreateGroup,
}) => {
  return (
    <div className="w-64 bg-sidebar-background border-r border-border-default">
      <h2 className="text-lg font-bold p-4 border-b border-border-default">
        Task Groups
      </h2>
      <ul className="p-2">
        {groups.map((group) => (
          <li
            key={group.id}
            className={`cursor-pointer px-4 py-2 hover:bg-sidebar-itemHover rounded-lg ${
              activeGroup === group.id
                ? "bg-sidebar-itemFocus font-semibold"
                : ""
            }`}
            onClick={() => onSelectGroup(group.id)}
          >
            {group.title}
          </li>
        ))}
      </ul>
      <button
        onClick={onCreateGroup}
        className="mx-4 px-4 py-2 bg-button-bg hover:bg-button-bgHover text-text-primary rounded-lg flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        New Group
      </button>
    </div>
  );
};

export default TaskGroupSidebar;
