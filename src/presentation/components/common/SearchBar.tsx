import React from "react";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
}) => {
  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-2xl mb-10 transition-all duration-300 focus-within:scale-[1.02]"
    >
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search web or bookmarks..."
          className="w-full py-4 pl-14 pr-6 rounded-full border border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-300/50 shadow-lg bg-white/90 dark:bg-gray-800/90 dark:border-gray-700 dark:focus:ring-blue-600/30 text-lg"
        />
        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
