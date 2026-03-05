"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

type Project = { id: string; title: string; slug: string; password_protected?: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSaved: (newSlug: string) => void;
};

export default function EditProjectModal({ open, onClose, project, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (open && project) {
      setTitle(project.title);
      setSlug(project.slug);
      setPasswordProtected(!!project.password_protected);
      setCurrentPassword("");
      setNewPassword("");
      setSaveError("");
    }
  }, [open, project]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !title.trim()) return;
    setSaveError("");
    const finalSlug = slugify(slug.trim()) || slugify(title) || "projekt";
    setSaving(true);

    if (passwordProtected && newPassword.trim()) {
      const res = await fetch("/api/project/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          newPassword: newPassword.trim(),
          currentPassword: project.password_protected ? currentPassword : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Passwort konnte nicht gesetzt werden.");
        setSaving(false);
        return;
      }
    }

    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", finalSlug)
      .neq("id", project.id)
      .maybeSingle();
    const uniqueSlug = existing ? `${finalSlug}-${Date.now().toString(36)}` : finalSlug;
    const updatePayload: { title: string; slug: string; password_protected: boolean; password_hash?: string | null } = {
      title: title.trim(),
      slug: uniqueSlug,
      password_protected: passwordProtected,
    };
    if (!passwordProtected) {
      updatePayload.password_hash = null;
    }
    const { error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", project.id);
    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved(uniqueSlug);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h2 id="edit-project-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Projekt bearbeiten
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="project-title" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Projektname"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="project-slug" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              URL (wird aus dem Namen erzeugt, bei Bedarf anpassbar)
            </label>
            <input
              id="project-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="projekt-slug"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              /project/{slug || "…"}
            </p>
          </div>
          {saveError && (
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          )}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={passwordProtected}
                onChange={(e) => setPasswordProtected(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Passwortschutz (für Kunden-Link)
              </span>
            </label>
            {passwordProtected && (
              <>
                {project?.password_protected && (
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Aktuelles Passwort (zur Bestätigung)"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                )}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={project?.password_protected ? "Neues Passwort" : "Passwort setzen"}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || (passwordProtected && !newPassword.trim())}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Speichern …" : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
