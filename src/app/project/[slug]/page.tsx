"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import GrundideenBoard from "@/components/GrundideenBoard";
import PillarPanel from "@/components/PillarPanel";
import VideoideenBoard from "@/components/VideoideenBoard";
import EditProjectModal from "@/components/EditProjectModal";
import type { Idea } from "@/components/IdeaCard";
import type { ProjectRow } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

function ProjectPasswordForm({
  projectId,
  onUnlocked,
}: {
  projectId: string;
  onUnlocked: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/project/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (res.ok) {
      onUnlocked();
    } else {
      setError(data.error || "Falsches Passwort");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Projektpasswort"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        autoFocus
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !password.trim()}
        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {submitting ? "Prüfe …" : "Entsperren"}
      </button>
    </form>
  );
}

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isSignedIn } = useAuth();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockChecked, setUnlockChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, slug, created_at, updated_at, password_protected")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) {
      setProject(null);
      return;
    }
    setProject(data as ProjectRow);
  }, [slug]);

  const checkUnlock = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/project/${projectId}/unlock`);
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      setUnlocked(!!json.unlocked);
      setPasswordProtected(!!json.passwordProtected);
    } catch {
      setUnlocked(false);
      setPasswordProtected(true);
    }
    setUnlockChecked(true);
  }, []);

  useEffect(() => {
    setLoading(true);
    setUnlockChecked(false);
    fetchProject().finally(() => setLoading(false));
  }, [fetchProject]);

  useEffect(() => {
    if (!project) return;
    checkUnlock(project.id);
  }, [project?.id, checkUnlock]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Laden …</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100 dark:bg-zinc-950 px-4">
        <p className="text-zinc-600 dark:text-zinc-400">Projekt nicht gefunden.</p>
        <a
          href="/"
          className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          Zur Projektliste
        </a>
      </div>
    );
  }

  const showBoard = unlockChecked && (!passwordProtected || unlocked);

  if (passwordProtected && unlockChecked && !unlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-100 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Passwort erforderlich
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Dieses Projekt ist für Kunden passwortgeschützt. Gib das Passwort ein, um fortzufahren.
          </p>
          <ProjectPasswordForm
            projectId={project.id}
            onUnlocked={() => {
              setUnlocked(true);
            }}
          />
        </div>
        <a
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
        >
          ← Zur Startseite
        </a>
      </div>
    );
  }

  if (!showBoard) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Laden …</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200/80 bg-white/95 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/95 sm:gap-3 sm:px-4">
        <a
          href="/"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Zurück zu Projekten"
        >
          ←
        </a>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {project.title}
        </span>
        <button
          type="button"
          onClick={() => setEditProjectOpen(true)}
          className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          title="Projekt bearbeiten"
        >
          Bearbeiten
        </button>
        <div className="flex min-h-[44px] items-center">
          <UserButton />
        </div>
      </div>
      <EditProjectModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
        onSaved={(newSlug) => {
          setEditProjectOpen(false);
          router.replace(`/project/${newSlug}`);
        }}
      />
      {/* Mobile: eine scrollbare Seite (Pillar → Grundideen → Videoideen). Desktop: zwei Spalten mit eigenem Scroll. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-hidden">
        <PillarPanel projectId={project.id} />
        <div className="flex flex-col gap-4 p-3 md:min-h-0 md:flex-1 md:flex-row md:gap-6 md:overflow-hidden md:p-6">
          <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 md:min-h-0 md:w-[380px] md:flex-1 md:overflow-hidden md:p-5">
            <GrundideenBoard
              projectId={project.id}
              selectedIdeaId={selectedIdea?.id ?? null}
              onSelectIdea={setSelectedIdea}
            />
          </aside>
          <main className="flex min-w-0 flex-1 flex-col rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 md:min-h-[200px] md:min-h-0 md:overflow-hidden md:p-5">
            <VideoideenBoard
              projectId={project.id}
              selectedIdeaId={selectedIdea?.id ?? null}
              selectedIdeaTitle={selectedIdea?.title ?? null}
              onClearIdeaFilter={() => setSelectedIdea(null)}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
