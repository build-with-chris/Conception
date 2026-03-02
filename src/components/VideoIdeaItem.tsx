"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";

export type VideoIdeaStatus = "idee" | "skizze" | "produktion" | "fertig";

export type VideoIdea = {
  id: string;
  idea_id?: string | null;
  title: string;
  status: VideoIdeaStatus;
  note?: string;
  tags?: string[];
  favorite?: boolean;
  updated_at?: string;
};

const STATUS_LABELS: Record<VideoIdeaStatus, string> = {
  idee: "Idee",
  skizze: "Skizze",
  produktion: "In Produktion",
  fertig: "Fertig",
};

const STATUS_OPTIONS: VideoIdeaStatus[] = ["idee", "skizze", "produktion", "fertig"];

type Props = {
  item: VideoIdea;
  onEdit?: (item: VideoIdea) => void;
  onDelete?: (item: VideoIdea) => void;
  onStatusChange?: (item: VideoIdea, status: VideoIdeaStatus) => void;
  onToggleFavorite?: (item: VideoIdea) => void;
};

export default function VideoIdeaItem({ item, onEdit, onDelete, onStatusChange, onToggleFavorite }: Props) {
  const otherStatuses = STATUS_OPTIONS.filter((s) => s !== item.status);

  return (
    <div className="group flex items-start gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-zinc-600">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.title}
        </p>
        {item.note && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {item.note}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {item.updated_at && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Bearbeitet {formatRelativeTime(item.updated_at)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            className={`rounded p-1.5 opacity-80 transition-opacity hover:opacity-100 ${item.favorite ? "text-amber-500" : "text-zinc-400 hover:text-amber-500"}`}
            aria-label={item.favorite ? "Von Favoriten entfernen" : "Als Favorit markieren"}
            title={item.favorite ? "Favorit entfernen" : "Favorit"}
          >
            ★
          </button>
        )}
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                aria-label="Bearbeiten"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="rounded p-1.5 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                aria-label="Löschen"
              >
                🗑
              </button>
            )}
          </div>
        )}
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {STATUS_LABELS[item.status]}
        </span>
        {onStatusChange && otherStatuses.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const v = e.target.value as VideoIdeaStatus;
              if (v) onStatusChange(item, v);
              e.target.value = "";
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            title="Move to …"
          >
            <option value="">Move to …</option>
            {otherStatuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
