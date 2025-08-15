import React from "react";
import { Bolt } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  onOptionOne: () => void;
  onOptionTwo: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  onOptionOne,
  onOptionTwo,
}) => {
  return (
    <div className="flex items-center w-full max-w-2xl mb-10 space-x-2">
      <form
        onSubmit={handleSearch}
        className="flex-1 transition-all duration-300 focus-within:scale-[1.02]"
      >
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search web or bookmarks..."
            className="w-full py-2 pl-10 pr-4 rounded-lg bg-input-background text-lg border-none"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </form>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Options"
            className="p-2 rounded-lg bg-input-background hover:bg-gray-200 dark:hover:bg-gray-700 shadow-lg"
          >
            <Bolt className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onOptionOne}>Bookmark</DropdownMenuItem>
          <DropdownMenuItem onSelect={onOptionTwo}>Theme</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SearchBar;
