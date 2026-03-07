"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { IdeaRow } from "@/lib/supabase/database.types";

import EmptyState from "./EmptyState";
import IdeaCard, { type Idea } from "./IdeaCard";
import QuickAddModal from "./QuickAddModal";
import SearchFilterBar, { type FilterOption } from "./SearchFilterBar";

function rowToIdea(r: IdeaRow): Idea {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    tags: r.tags?.length ? r.tags : undefined,
    favorite: r.favorite ?? false,
    updated_at: r.updated_at,
  };
}

function sortIdeasByFavoriteThenUpdated(a: Idea, b: Idea): number {
  if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
  const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
  const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
  return tB - tA;
}

function filterIdeas(ideas: Idea[], search: string, activeTagIds: string[]) {
  let out = ideas;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        (i.tags && i.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }
  if (activeTagIds.length > 0) {
    out = out.filter(
      (i) => i.tags && activeTagIds.some((tid) => i.tags!.includes(tid))
    );
  }
  return out;
}

type Props = {
  projectId: string;
  selectedIdeaId: string | null;
  onSelectIdea: (idea: Idea | null) => void;
  /** Kategorie-Titel wird von der Seite gesetzt (z. B. im Karten-Header) */
  hideSectionTitle?: boolean;
};

export default function GrundideenBoard({ projectId, selectedIdeaId, onSelectIdea, hideSectionTitle }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formTags, setFormTags] = useState("");

  const fetchIdeas = useCallback(async () => {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("project_id", projectId)
      .order("favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    if (!error) setIdeas((data ?? []).map(rowToIdea).sort(sortIdeasByFavoriteThenUpdated));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === "I") {
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

  const tagOptions: FilterOption[] = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((i) => i.tags?.forEach((t) => set.add(t)));
    return Array.from(set).map((id) => ({ id, label: id }));
  }, [ideas]);

  const filtered = useMemo(
    () => filterIdeas(ideas, search, activeTags),
    [ideas, search, activeTags]
  );

  const openAdd = () => {
    setEditingIdea(null);
    setFormTitle("");
    setFormSummary("");
    setFormTags("");
    setModalOpen(true);
  };

  const openEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setFormTitle(idea.title);
    setFormSummary(idea.summary);
    setFormTags(idea.tags?.join(", ") ?? "");
    setModalOpen(true);
  };

  const handleSelectIdea = (idea: Idea) => {
    onSelectIdea(selectedIdeaId === idea.id ? null : idea);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);
    try {
      const tags = formTags.split(",").map((t) => t.trim()).filter(Boolean);
      if (editingIdea) {
        // @ts-expect-error Supabase client infers .update() arg as never with generic Database type
        const { error } = await supabase.from("ideas").update({ title: formTitle.trim(), summary: formSummary.trim(), tags }).eq("id", editingIdea.id);
        if (error) throw error;
      } else {
        // @ts-expect-error Supabase client infers .insert() arg as never with generic Database type
        const { error } = await supabase.from("ideas").insert({ project_id: projectId, title: formTitle.trim(), summary: formSummary.trim(), tags });
        if (error) throw error;
      }
      await fetchIdeas();
      setModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Speichern fehlgeschlagen.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (idea: Idea) => {
    if (!confirm("Grundidee wirklich löschen?")) return;
    await supabase.from("ideas").delete().eq("id", idea.id);
    await fetchIdeas();
    if (selectedIdeaId === idea.id) onSelectIdea(null);
  };

  const handleToggleFavorite = async (idea: Idea) => {
    // @ts-expect-error Supabase client infers .update() arg as never with generic Database type
    await supabase.from("ideas").update({ favorite: !idea.favorite }).eq("id", idea.id);
    await fetchIdeas();
  };

  const toggleTag = (id: string) => {
    setActiveTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <section className="flex h-auto min-h-0 flex-col gap-3 md:h-full md:gap-5">
      <div className="flex shrink-0 items-center justify-between">
        {!hideSectionTitle && (
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Grundideen
          </h2>
        )}
        {hideSectionTitle && <span className="flex-1" />}
        <button
          type="button"
          onClick={openAdd}
          className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Neue Grundidee (⌘⇧I)"
        >
          + Karte <span className="hidden text-zinc-400 sm:inline">⌘⇧I</span>
        </button>
      </div>

      <SearchFilterBar
        searchPlaceholder="Grundideen durchsuchen …"
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={tagOptions}
        activeFilterIds={activeTags}
        onFilterToggle={toggleTag}
      />

      <div className="flex flex-col gap-4 overflow-visible md:overscroll-behavior-contain md:min-h-0 md:flex-1 md:overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-500">Laden …</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={ideas.length === 0 ? "Noch keine Grundideen" : "Keine Treffer"}
            description={
              ideas.length === 0
                ? "Lege die ersten Ideen-Karten an."
                : "Suche oder Filter anpassen."
            }
            actionLabel={ideas.length === 0 ? "Erste Karte anlegen" : undefined}
            onAction={ideas.length === 0 ? openAdd : undefined}
          />
        ) : (
          filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isSelected={selectedIdeaId === idea.id}
              onSelect={handleSelectIdea}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))
        )}
      </div>

      <QuickAddModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIdea ? "Grundidee bearbeiten" : "Neue Grundidee"}
        submitLabel={editingIdea ? "Speichern" : "Hinzufügen"}
        isSubmitting={submitting}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="idea-title" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Titel
            </label>
            <input
              id="idea-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="z. B. Emotionaler Einstieg"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="idea-summary" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Kurzbeschreibung
            </label>
            <textarea
              id="idea-summary"
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              placeholder="In ein paar Sätzen …"
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="idea-tags" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags (kommagetrennt)
            </label>
            <input
              id="idea-tags"
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="z. B. Story, Tonalität"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </QuickAddModal>
    </section>
  );
}
