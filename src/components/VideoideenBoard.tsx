"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { IdeaRow } from "@/lib/supabase/database.types";
import type { VideoIdeaRow } from "@/lib/supabase/database.types";
import EmptyState from "./EmptyState";
import QuickAddModal from "./QuickAddModal";
import SearchFilterBar, { type FilterOption } from "./SearchFilterBar";
import VideoIdeaItem, {
  type VideoIdea,
  type VideoIdeaStatus,
} from "./VideoIdeaItem";

const STATUS_OPTIONS: FilterOption[] = [
  { id: "idee", label: "Idee" },
  { id: "skizze", label: "Skizze" },
  { id: "produktion", label: "In Produktion" },
  { id: "fertig", label: "Fertig" },
];

function rowToVideoIdea(r: VideoIdeaRow): VideoIdea {
  return {
    id: r.id,
    idea_id: r.idea_id ?? undefined,
    title: r.title,
    status: r.status as VideoIdeaStatus,
    note: r.note ?? undefined,
    tags: r.tags?.length ? r.tags : undefined,
    favorite: r.favorite ?? false,
    updated_at: r.updated_at,
  };
}

function filterVideoIdeas(
  items: VideoIdea[],
  search: string,
  activeStatusIds: string[],
  byIdeaId: string | null
) {
  let out = items;
  if (byIdeaId) {
    out = out.filter((i) => i.idea_id === byIdeaId);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.note && i.note.toLowerCase().includes(q))
    );
  }
  if (activeStatusIds.length > 0) {
    out = out.filter((i) => activeStatusIds.includes(i.status));
  }
  return out;
}

type Props = {
  selectedIdeaId: string | null;
  selectedIdeaTitle: string | null;
  onClearIdeaFilter: () => void;
};

export default function VideoideenBoard({
  selectedIdeaId,
  selectedIdeaTitle,
  onClearIdeaFilter,
}: Props) {
  const [items, setItems] = useState<VideoIdea[]>([]);
  const [ideas, setIdeas] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoIdea | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formStatus, setFormStatus] = useState<VideoIdeaStatus>("idee");
  const [formIdeaId, setFormIdeaId] = useState<string>("");
  const [formTags, setFormTags] = useState("");

  const fetchVideoIdeas = useCallback(async () => {
    const { data, error } = await supabase
      .from("video_ideas")
      .select("*")
      .order("favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    if (!error) setItems((data ?? []).map(rowToVideoIdea));
  }, []);

  const fetchIdeas = useCallback(async () => {
    const { data } = await supabase.from("ideas").select("id, title").order("title");
    setIdeas((data ?? []).map((r) => ({ id: r.id, title: r.title })));
  }, []);

  useEffect(() => {
    Promise.all([fetchVideoIdeas(), fetchIdeas()]).finally(() => setLoading(false));
  }, [fetchVideoIdeas, fetchIdeas]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === "V") {
        const target = e.target as HTMLElement;
        if (!target.closest("input, textarea, select")) {
          e.preventDefault();
          openAdd();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = useMemo(
    () => filterVideoIdeas(items, search, activeStatuses, selectedIdeaId),
    [items, search, activeStatuses, selectedIdeaId]
  );

  const openAdd = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormNote("");
    setFormStatus("idee");
    setFormIdeaId(selectedIdeaId ?? "");
    setFormTags("");
    setModalOpen(true);
  };

  const openEdit = (item: VideoIdea) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormNote(item.note ?? "");
    setFormStatus(item.status);
    setFormIdeaId(item.idea_id ?? "");
    setFormTags(item.tags?.join(", ") ?? "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const tags = formTags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: formTitle.trim(),
      note: formNote.trim() || null,
      status: formStatus,
      idea_id: formIdeaId || null,
      tags,
    };
    if (editingItem) {
      await supabase.from("video_ideas").update(payload).eq("id", editingItem.id);
    } else {
      await supabase.from("video_ideas").insert(payload);
    }
    await fetchVideoIdeas();
    setModalOpen(false);
  };

  const handleDelete = async (item: VideoIdea) => {
    if (!confirm("Videoidee wirklich löschen?")) return;
    await supabase.from("video_ideas").delete().eq("id", item.id);
    await fetchVideoIdeas();
  };

  const handleStatusChange = async (item: VideoIdea, status: VideoIdeaStatus) => {
    await supabase.from("video_ideas").update({ status }).eq("id", item.id);
    await fetchVideoIdeas();
  };

  const handleToggleFavorite = async (item: VideoIdea) => {
    await supabase
      .from("video_ideas")
      .update({ favorite: !item.favorite })
      .eq("id", item.id);
    await fetchVideoIdeas();
  };

  const toggleStatus = (id: string) => {
    setActiveStatuses((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <section className="flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Videoideen
        </h2>
        {selectedIdeaId && selectedIdeaTitle && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800">
            <span className="text-zinc-600 dark:text-zinc-400">
              Gefiltert nach: <strong>{selectedIdeaTitle}</strong>
            </span>
            <button
              type="button"
              onClick={onClearIdeaFilter}
              className="rounded px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Alle anzeigen
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Neue Videoidee (⌘⇧V)"
        >
          + Idee <span className="text-zinc-400">⌘⇧V</span>
        </button>
      </div>

      <SearchFilterBar
        searchPlaceholder="Videoideen durchsuchen …"
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={STATUS_OPTIONS}
        activeFilterIds={activeStatuses}
        onFilterToggle={toggleStatus}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-500">Laden …</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              selectedIdeaId
                ? "Keine Videoideen zu dieser Grundidee"
                : items.length === 0
                  ? "Noch keine Videoideen"
                  : "Keine Treffer"
            }
            description={
              selectedIdeaId
                ? "Videoideen mit dieser Grundidee verknüpfen oder alle anzeigen."
                : items.length === 0
                  ? "Füge die erste Videoidee hinzu."
                  : "Suche oder Status-Filter anpassen."
            }
            actionLabel={selectedIdeaId ? "Alle anzeigen" : items.length === 0 ? "Erste Idee hinzufügen" : undefined}
            onAction={selectedIdeaId ? onClearIdeaFilter : items.length === 0 ? openAdd : undefined}
          />
        ) : (
          filtered.map((item) => (
            <VideoIdeaItem
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onToggleFavorite={handleToggleFavorite}
            />
          ))
        )}
      </div>

      <QuickAddModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Videoidee bearbeiten" : "Neue Videoidee"}
        submitLabel={editingItem ? "Speichern" : "Hinzufügen"}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="video-title" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Titel
            </label>
            <input
              id="video-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="z. B. Teaser 15s"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="video-idea-id" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Grundidee (optional)
            </label>
            <select
              id="video-idea-id"
              value={formIdeaId}
              onChange={(e) => setFormIdeaId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">— Keine —</option>
              {ideas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="video-note" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notiz (optional)
            </label>
            <input
              id="video-note"
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="z. B. Hook für Social"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="video-status" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </label>
            <select
              id="video-status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as VideoIdeaStatus)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="video-tags" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags (kommagetrennt, optional)
            </label>
            <input
              id="video-tags"
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="z. B. Social, Teaser"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </QuickAddModal>
    </section>
  );
}
