"use client";

import { useRef, useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import TextOverviewModal from "./TextOverviewModal";

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
  skizze_notes?: string | null;
  skizze_todos?: string[];
  skizze_comment?: string | null;
  script?: string | null;
  caption?: string | null;
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
  onMoveToSkizze?: (item: VideoIdea) => void;
  onToggleFavorite?: (item: VideoIdea) => void;
  /** Klick auf Karteninhalt (nicht auf Buttons): Skizze öffnen oder Bearbeiten */
  onOpen?: (item: VideoIdea) => void;
};

export default function VideoIdeaItem({ item, onEdit, onDelete, onStatusChange, onMoveToSkizze, onToggleFavorite, onOpen }: Props) {
  const otherStatuses = STATUS_OPTIONS.filter((s) => s !== item.status);
  const [moveToOpen, setMoveToOpen] = useState(false);
  const [textOverview, setTextOverview] = useState<{ title: string; content: string } | null>(null);
  const moveToRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moveToOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moveToRef.current && !moveToRef.current.contains(e.target as Node)) {
        setMoveToOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [moveToOpen]);

  const handleMoveTo = (v: VideoIdeaStatus) => {
    setMoveToOpen(false);
    if (v === "skizze" && onMoveToSkizze) {
      onMoveToSkizze(item);
    } else if (onStatusChange) {
      onStatusChange(item, v);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, [role='menu'], select")) return;
    onOpen?.(item);
  };

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen ? handleCardClick : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(item); } } : undefined}
      className={`group relative rounded-xl border border-zinc-200/80 bg-white p-4 transition-colors dark:border-zinc-700/80 dark:bg-zinc-900/80 md:p-5 ${onOpen ? "cursor-pointer hover:border-zinc-300 active:opacity-95 dark:hover:border-zinc-600" : "hover:border-zinc-300 dark:hover:border-zinc-600"}`}
    >
      {/* Zeile 1: nur Symbole – Klick öffnet Karte nicht */}
      <div className="flex flex-wrap items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-lg transition-colors hover:bg-amber-50 active:bg-amber-100 dark:hover:bg-amber-950/50 dark:active:bg-amber-900/30 ${item.favorite ? "text-amber-500" : "text-zinc-400 hover:text-amber-500"}`}
            aria-label={item.favorite ? "Von Favoriten entfernen" : "Als Favorit markieren"}
            title={item.favorite ? "Favorit entfernen" : "Favorit"}
          >
            ★
          </button>
        )}
        {(onEdit || onDelete) && (
          <div className="flex gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                aria-label="Bearbeiten"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                aria-label="Löschen"
              >
                🗑
              </button>
            )}
          </div>
        )}
        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {STATUS_LABELS[item.status]}
        </span>
      </div>
      <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
        {item.title}
      </h3>
      {/* Text über volle Breite (wie Grundideen) */}
      {item.note && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {item.note}
        </p>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {((item.status === "skizze" && (item.skizze_notes?.trim() || (item.skizze_todos?.length ?? 0) > 0 || item.skizze_comment?.trim())) || item.updated_at) && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {item.status === "skizze" && (item.skizze_notes?.trim() || (item.skizze_todos?.length ?? 0) > 0 || item.skizze_comment?.trim()) && "Notizen & To-dos beim Bearbeiten einsehbar"}
          {item.status === "skizze" && (item.skizze_notes?.trim() || (item.skizze_todos?.length ?? 0) > 0 || item.skizze_comment?.trim()) && item.updated_at && " · "}
          {item.updated_at && `Bearbeitet ${formatRelativeTime(item.updated_at)}`}
        </p>
      )}
      {/* In Produktion: Skizze-Notizen, Skript, Caption – Klick öffnet Übersicht */}
      {item.status === "produktion" && (
        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {item.skizze_notes?.trim() && (
            <button
              type="button"
              onClick={() => setTextOverview({ title: "Skizze-Notizen", content: item.skizze_notes ?? "" })}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Skizze-Notizen
            </button>
          )}
          <button
            type="button"
            onClick={() => setTextOverview({ title: "Skript", content: item.script ?? "" })}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Skript
          </button>
          <button
            type="button"
            onClick={() => setTextOverview({ title: "Caption", content: item.caption ?? "" })}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Caption
          </button>
        </div>
      )}
      <TextOverviewModal
        open={!!textOverview}
        onClose={() => setTextOverview(null)}
        title={textOverview?.title ?? ""}
        content={textOverview?.content ?? ""}
      />
      {/* Move to: unten rechts in der Card, Dropdown öffnet sich dort */}
      {(onStatusChange || onMoveToSkizze) && otherStatuses.length > 0 && (
        <div ref={moveToRef} className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMoveToOpen((o) => !o); }}
              className="flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              aria-expanded={moveToOpen}
              aria-haspopup="true"
              aria-label="Status ändern"
              title="Move to …"
            >
              Move to …
              <span className={moveToOpen ? "rotate-180" : ""}>▼</span>
            </button>
            {moveToOpen && (
              <div
                className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
                role="menu"
              >
                {otherStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    onClick={() => handleMoveTo(s)}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
