"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { IdeaRow } from "@/lib/supabase/database.types";
import type { VideoIdeaRow } from "@/lib/supabase/database.types";
import DropdownSelect from "./DropdownSelect";
import EmptyState from "./EmptyState";
import QuickAddModal from "./QuickAddModal";
import SearchFilterBar, { type FilterOption } from "./SearchFilterBar";
import SkizzeModal from "./SkizzeModal";
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
    skizze_notes: r.skizze_notes ?? undefined,
    skizze_todos: Array.isArray(r.skizze_todos) ? r.skizze_todos : undefined,
    skizze_comment: r.skizze_comment ?? undefined,
    script: r.script ?? undefined,
    caption: r.caption ?? undefined,
  };
}

function sortVideoIdeasByFavoriteThenUpdated(a: VideoIdea, b: VideoIdea): number {
  if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
  const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
  const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
  return tB - tA;
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
  projectId: string;
  selectedIdeaId: string | null;
  selectedIdeaTitle: string | null;
  onClearIdeaFilter: () => void;
};

export default function VideoideenBoard({
  projectId,
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
  const [formSkizzeNotes, setFormSkizzeNotes] = useState("");
  const [formSkizzeTodos, setFormSkizzeTodos] = useState<string[]>([]);
  const [formSkizzeNewTodo, setFormSkizzeNewTodo] = useState("");
  const [formSkizzeComment, setFormSkizzeComment] = useState("");
  const [formScript, setFormScript] = useState("");
  const [formCaption, setFormCaption] = useState("");
  const [skizzeModalItem, setSkizzeModalItem] = useState<VideoIdea | null>(null);

  const fetchVideoIdeas = useCallback(async () => {
    const { data, error } = await supabase
      .from("video_ideas")
      .select("*")
      .eq("project_id", projectId)
      .order("favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    if (!error) setItems((data ?? []).map(rowToVideoIdea).sort(sortVideoIdeasByFavoriteThenUpdated));
  }, [projectId]);

  const fetchIdeas = useCallback(async () => {
    const { data } = await supabase.from("ideas").select("id, title").eq("project_id", projectId).order("title");
    setIdeas((data ?? []) as { id: string; title: string }[]);
  }, [projectId]);

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
    setFormSkizzeNotes("");
    setFormSkizzeTodos([]);
    setFormSkizzeComment("");
    setFormScript("");
    setFormCaption("");
    setModalOpen(true);
  };

  const openEdit = (item: VideoIdea) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormNote(item.note ?? "");
    setFormStatus(item.status);
    setFormIdeaId(item.idea_id ?? "");
    setFormTags(item.tags?.join(", ") ?? "");
    setFormSkizzeNotes(item.skizze_notes ?? "");
    setFormSkizzeTodos(item.skizze_todos ?? []);
    setFormSkizzeComment(item.skizze_comment ?? "");
    setFormScript(item.script ?? "");
    setFormCaption(item.caption ?? "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const tags = formTags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload: Record<string, unknown> = {
      title: formTitle.trim(),
      note: formNote.trim() || null,
      status: formStatus,
      idea_id: formIdeaId || null,
      tags,
    };
    if (formStatus === "skizze") {
      payload.skizze_notes = formSkizzeNotes.trim() || null;
      payload.skizze_todos = formSkizzeTodos;
      payload.skizze_comment = formSkizzeComment.trim() || null;
    }
    if (formStatus === "produktion") {
      payload.script = formScript.trim() || null;
      payload.caption = formCaption.trim() || null;
    }
    if (editingItem) {
      // @ts-expect-error Supabase client infers .update() arg as never with generic Database type
      await supabase.from("video_ideas").update(payload).eq("id", editingItem.id);
    } else {
      payload.project_id = projectId;
      // @ts-expect-error Supabase client infers .insert() arg as never with generic Database type
      await supabase.from("video_ideas").insert(payload);
    }
    await fetchVideoIdeas();
    setModalOpen(false);
  };

  const addSkizzeTodo = () => {
    const t = formSkizzeNewTodo.trim();
    if (t) {
      setFormSkizzeTodos((prev) => [...prev, t]);
      setFormSkizzeNewTodo("");
    }
  };

  const removeSkizzeTodo = (index: number) => {
    setFormSkizzeTodos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (item: VideoIdea) => {
    if (!confirm("Videoidee wirklich löschen?")) return;
    await supabase.from("video_ideas").delete().eq("id", item.id);
    await fetchVideoIdeas();
  };

  const handleStatusChange = async (item: VideoIdea, status: VideoIdeaStatus) => {
    if (status === "skizze") {
      setSkizzeModalItem(item);
      return;
    }
    // @ts-expect-error Supabase client infers .update() arg as never with generic Database type
    await supabase.from("video_ideas").update({ status }).eq("id", item.id);
    await fetchVideoIdeas();
  };

  const handleSkizzeSave = async (
    itemId: string,
    data: { notes: string; todos: string[]; comment: string }
  ) => {
    const payload = {
      status: "skizze" as const,
      skizze_notes: data.notes || null,
      skizze_todos: data.todos,
      skizze_comment: data.comment || null,
    };
    // @ts-expect-error Supabase client infers .update() arg as never with generic Database type
    await supabase.from("video_ideas").update(payload).eq("id", itemId);
    await fetchVideoIdeas();
    setSkizzeModalItem(null);
  };

  const handleToggleFavorite = async (item: VideoIdea) => {
    // @ts-expect-error Supabase client infers .update() arg as never with generic Database type
    await supabase.from("video_ideas").update({ favorite: !item.favorite }).eq("id", item.id);
    await fetchVideoIdeas();
  };

  const toggleStatus = (id: string) => {
    setActiveStatuses((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <section className="flex h-auto min-h-0 flex-col gap-3 md:h-full md:gap-5">
      {selectedIdeaId && selectedIdeaTitle && (
        <div className="sticky top-0 z-10 -mx-3 -mt-3 flex shrink-0 items-center gap-2 border-b border-zinc-200/80 bg-white/95 px-3 py-2 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 md:-mx-5 md:-mt-5 md:px-5">
          <button
            type="button"
            onClick={onClearIdeaFilter}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Zurück zu allen Grundideen"
          >
            <span aria-hidden>←</span>
            <span className="text-sm font-medium">Zurück</span>
          </button>
          <span className="min-w-0 truncate text-sm text-zinc-500 dark:text-zinc-400" title={selectedIdeaTitle}>
            {selectedIdeaTitle}
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Videoideen
        </h2>
        {selectedIdeaId && selectedIdeaTitle && (
          <div className="hidden items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800 md:flex">
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
          className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Neue Videoidee (⌘⇧V)"
        >
          + Idee <span className="hidden text-zinc-400 sm:inline">⌘⇧V</span>
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

      <div className="flex flex-col gap-3 overflow-visible md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-behavior-contain">
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
              onMoveToSkizze={(i) => setSkizzeModalItem(i)}
              onToggleFavorite={handleToggleFavorite}
              onOpen={(i) => (i.status === "skizze" ? setSkizzeModalItem(i) : openEdit(i))}
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
          <DropdownSelect
            id="video-idea-id"
            label="Grundidee (optional)"
            value={formIdeaId}
            options={ideas.map((idea) => ({ value: idea.id, label: idea.title }))}
            placeholder="— Keine —"
            allowEmpty
            onChange={setFormIdeaId}
          />
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
          <DropdownSelect
            id="video-status"
            label="Status"
            value={formStatus}
            options={STATUS_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
            onChange={(v) => setFormStatus(v as VideoIdeaStatus)}
          />
          {formStatus === "skizze" && (
            <>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Skizze-Details
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-skizze-notes" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Ausführliche Notizen
                    </label>
                    <textarea
                      id="edit-skizze-notes"
                      value={formSkizzeNotes}
                      onChange={(e) => setFormSkizzeNotes(e.target.value)}
                      rows={4}
                      placeholder="Konzept, Ablauf, Besonderheiten …"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      To-dos
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formSkizzeNewTodo}
                        onChange={(e) => setFormSkizzeNewTodo(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkizzeTodo())}
                        placeholder="To-do eingeben, Enter oder + To-do"
                        className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={addSkizzeTodo}
                        className="shrink-0 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                      >
                        + To-do
                      </button>
                    </div>
                    {formSkizzeTodos.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {formSkizzeTodos.map((todo, i) => (
                          <li key={i} className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
                            <span className="flex-1">{todo}</span>
                            <button
                              type="button"
                              onClick={() => removeSkizzeTodo(i)}
                              className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-700"
                              aria-label="To-do entfernen"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label htmlFor="edit-skizze-comment" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Kommentar
                    </label>
                    <textarea
                      id="edit-skizze-comment"
                      value={formSkizzeComment}
                      onChange={(e) => setFormSkizzeComment(e.target.value)}
                      rows={2}
                      placeholder="Anmerkungen, Hinweise …"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {formStatus === "produktion" && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                In Produktion
              </p>
              {formSkizzeNotes.trim() && (
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Skizze-Notizen (aus Skizze)
                  </label>
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {formSkizzeNotes}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="video-script" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Skript
                  </label>
                  <textarea
                    id="video-script"
                    value={formScript}
                    onChange={(e) => setFormScript(e.target.value)}
                    rows={5}
                    placeholder="Text zum Video …"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label htmlFor="video-caption" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Caption
                  </label>
                  <textarea
                    id="video-caption"
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    rows={4}
                    placeholder="Caption-Text …"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}
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

      <SkizzeModal
        open={!!skizzeModalItem}
        onClose={() => setSkizzeModalItem(null)}
        item={skizzeModalItem}
        onSave={handleSkizzeSave}
      />
    </section>
  );
}
