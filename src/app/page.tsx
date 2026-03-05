"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase/client";
import type { ProjectRow } from "@/lib/supabase/database.types";
import { slugify } from "@/lib/slugify";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setFetchError(null);
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug, created_at, updated_at, password_protected")
        .order("created_at", { ascending: false });
      if (error) {
        setFetchError(error.message);
        setProjects([]);
      } else {
        setProjects(data ?? []);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    let slug = slugify(title);
    const { data: existing } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;
    // @ts-expect-error Supabase client infers .insert() arg as never with generic Database type
    const { data: inserted, error } = await supabase.from("projects").insert({ title, slug }).select("slug").single();
    setAdding(false);
    setNewTitle("");
    const slugOut = inserted as { slug: string } | null;
    if (!error && slugOut?.slug) {
      router.push(`/project/${slugOut.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Projekte
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Wähle ein Projekt oder lege ein neues an. Lesbare URLs: /project/[slug].
            </p>
          </div>
          <UserButton />
        </div>
        <form onSubmit={handleAddProject} className="mb-10 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Neues Projekt (Name)"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {adding ? "Anlegen …" : "+ Projekt"}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-zinc-500">Laden …</p>
        ) : fetchError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Projekte konnten nicht geladen werden</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{fetchError}</p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Prüfe Supabase: gleiche URL/Key wie in den Env-Variablen? Migrationen (z. B. 004 + 005) ausgeführt?
            </p>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Projekte. Lege oben das erste an.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <a
                  href={`/project/${p.slug}`}
                  className="block rounded-xl border border-zinc-200/80 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-zinc-600"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{p.title}</span>
                  {p.password_protected && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      Passwort
                    </span>
                  )}
                  <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">/project/{p.slug}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
