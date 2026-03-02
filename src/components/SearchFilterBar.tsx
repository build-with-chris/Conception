"use client";

export type FilterOption = {
  id: string;
  label: string;
};

type Props = {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions?: FilterOption[];
  activeFilterIds?: string[];
  onFilterToggle?: (id: string) => void;
};

export default function SearchFilterBar({
  searchPlaceholder = "Suchen …",
  searchValue,
  onSearchChange,
  filterOptions = [],
  activeFilterIds = [],
  onFilterToggle,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/80 py-2.5 px-4 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
          aria-label="Suchen"
        />
      </div>
      {filterOptions.length > 0 && onFilterToggle && (
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => {
            const isActive = activeFilterIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFilterToggle(opt.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
