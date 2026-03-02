"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";

export type Idea = {
  id: string;
  title: string;
  summary: string;
  tags?: string[];
  favorite?: boolean;
  updated_at?: string;
};

type Props = {
  idea: Idea;
  isSelected?: boolean;
  onSelect?: (idea: Idea) => void;
  onEdit?: (idea: Idea) => void;
  onDelete?: (idea: Idea) => void;
  onToggleFavorite?: (idea: Idea) => void;
};

export default function IdeaCard({ idea, isSelected, onSelect, onEdit, onDelete, onToggleFavorite }: Props) {
  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? (e) => { if (!(e.target as HTMLElement).closest("button")) onSelect(idea); } : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(idea); } } : undefined}
      className={`group rounded-xl border p-5 transition-shadow dark:bg-zinc-900/80 ${
        isSelected
          ? "border-zinc-400 bg-zinc-50 shadow-sm ring-1 ring-zinc-300 dark:border-zinc-500 dark:bg-zinc-800/80 dark:ring-zinc-600"
          : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700/80 dark:hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {idea.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(idea); }}
              className={`rounded p-1.5 opacity-80 transition-opacity hover:opacity-100 ${idea.favorite ? "text-amber-500" : "text-zinc-400 hover:text-amber-500"}`}
              aria-label={idea.favorite ? "Von Favoriten entfernen" : "Als Favorit markieren"}
              title={idea.favorite ? "Favorit entfernen" : "Favorit"}
            >
              ★
            </button>
          )}
          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(idea); }}
                  className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                  aria-label="Bearbeiten"
                >
                  ✎
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(idea); }}
                  className="rounded p-1.5 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                  aria-label="Löschen"
                >
                  🗑
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {idea.summary}
      </p>
      {idea.tags && idea.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {idea.updated_at && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Zuletzt bearbeitet {formatRelativeTime(idea.updated_at)}
        </p>
      )}
    </article>
  );
}
