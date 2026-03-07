"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { PillarRow } from "@/lib/supabase/database.types";
import QuickAddModal from "./QuickAddModal";

const PILLAR_LABEL = "Leitbild & Annahmen";

const DEFAULT_LEITBILD = `Alle für eine.
Gemeinsam tragen wir Susanne nach vorn – als Teamleistung, nicht als One-Woman-Show.`;

const DEFAULT_ANNAHMEN = `1. Susanne erreicht die Stichwahl.
2. Content ist auch ohne viel direkte Mitarbeit von Susanne produzierbar (planbar, vorproduzierbar, delegierbar).
3. Hohe Mobilisierung ist möglich – sowohl bei Stammwählern als auch bei Unentschlossenen.`;

function AnnahmenList({ text }: { text: string }) {
  const items = text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(Boolean);
  if (items.length === 0) return <p className="text-zinc-600 dark:text-zinc-400">{text}</p>;
  return (
    <ol className="list-inside list-decimal space-y-1 text-zinc-700 dark:text-zinc-300">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

type Props = { projectId: string };

export default function PillarPanel({ projectId }: Props) {
  const [pillar, setPillar] = useState<PillarRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editLeitbild, setEditLeitbild] = useState("");
  const [editAnnahmen, setEditAnnahmen] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);

  const fetchPillar = useCallback(async () => {
    const { data, error } = await supabase
      .from("pillars")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!error) setPillar(data ?? null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchPillar();
  }, [fetchPillar]);

  const openEdit = () => {
    setEditLeitbild(pillar?.leitbild ?? DEFAULT_LEITBILD);
    setEditAnnahmen(pillar?.annahmen ?? DEFAULT_ANNAHMEN);
    setEditOpen(true);
  };

  const handleSavePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pillar?.id) {
      // @ts-expect-error Supabase client infers .update() arg as never with generic Database type
      await supabase.from("pillars").update({ leitbild: editLeitbild, annahmen: editAnnahmen }).eq("id", pillar.id);
    } else {
      // @ts-expect-error Supabase client infers .insert() arg as never with generic Database type
      await supabase.from("pillars").insert({ project_id: projectId, leitbild: editLeitbild, annahmen: editAnnahmen });
    }
    await fetchPillar();
    setEditOpen(false);
  };

  const leitbild = pillar?.leitbild ?? DEFAULT_LEITBILD;
  const annahmen = pillar?.annahmen ?? DEFAULT_ANNAHMEN;

  return (
    <>
      {/* Mobile: einklappbar, damit Platz für Grundideen & Videoideen bleibt */}
      <header className="shrink-0 border-b border-zinc-200 bg-zinc-50/95 dark:border-zinc-800 dark:bg-zinc-900/95 md:sticky md:top-0 md:z-50 md:backdrop-blur">
        <div className={`md:mx-auto md:max-w-6xl md:px-6 ${desktopExpanded ? "md:py-5" : "md:py-2"}`}>
          <button
            type="button"
            onClick={() => setMobileExpanded((e) => !e)}
            className="flex w-full min-h-[48px] items-center justify-between gap-2 px-4 py-3 text-left md:hidden"
            aria-expanded={mobileExpanded}
            aria-label={mobileExpanded ? `${PILLAR_LABEL} einklappen` : `${PILLAR_LABEL} anzeigen`}
          >
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{PILLAR_LABEL}</span>
            <span className="shrink-0 text-zinc-400" aria-hidden>{mobileExpanded ? "▼" : "▶"}</span>
          </button>
          {mobileExpanded && (
            <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700 md:hidden">
              <section className="mb-4">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Leitbild</span>
                <p className="whitespace-pre-wrap text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{loading ? "…" : leitbild}</p>
              </section>
              <section>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Annahmen</span>
                <div className="text-sm leading-relaxed">{loading ? "…" : <AnnahmenList text={annahmen} />}</div>
              </section>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openEdit(); }}
                className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
              >
                Bearbeiten
              </button>
            </div>
          )}
          {/* Desktop: geschlossen = Navbar-Höhe, geöffnet = voller Inhalt mit Pagination-Button */}
          <div className="hidden md:block">
            {!desktopExpanded ? (
              <div className="flex min-h-[48px] items-center justify-between gap-4">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{PILLAR_LABEL}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openEdit}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopExpanded(true)}
                    className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    aria-expanded="false"
                    aria-label="Leitbild und Annahmen anzeigen"
                  >
                    Anzeigen
                    <span aria-hidden>▼</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 pb-2 md:flex-row md:items-start md:gap-10">
                <section className="min-w-0 flex-1">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Leitbild</span>
                  <p className="whitespace-pre-wrap text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{loading ? "…" : leitbild}</p>
                </section>
                <div className="hidden w-px shrink-0 self-stretch bg-zinc-200 md:block dark:bg-zinc-700" aria-hidden />
                <section className="min-w-0 flex-1 md:max-w-md">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Annahmen</span>
                  <div className="text-sm leading-relaxed">{loading ? "…" : <AnnahmenList text={annahmen} />}</div>
                </section>
                <div className="flex shrink-0 flex-col items-end gap-2 self-start md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={openEdit}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopExpanded(false)}
                    className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    aria-expanded="true"
                    aria-label="Leitbild und Annahmen einklappen"
                  >
                    Einklappen
                    <span aria-hidden>▲</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <QuickAddModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Grundpfeiler bearbeiten"
        submitLabel="Speichern"
        onSubmit={handleSavePillar}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="pillar-leitbild" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Leitbild
            </label>
            <textarea
              id="pillar-leitbild"
              value={editLeitbild}
              onChange={(e) => setEditLeitbild(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="pillar-annahmen" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Annahmen (nummerierte Liste, eine pro Zeile)
            </label>
            <textarea
              id="pillar-annahmen"
              value={editAnnahmen}
              onChange={(e) => setEditAnnahmen(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </QuickAddModal>
    </>
  );
}
