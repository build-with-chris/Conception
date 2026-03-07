"use client";

import { useEffect, useState } from "react";
import type { VideoIdea } from "./VideoIdeaItem";

function useEscapeAndLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
}

type Props = {
  open: boolean;
  onClose: () => void;
  item: VideoIdea | null;
  onSave: (
    itemId: string,
    data: { notes: string; todos: string[]; comment: string }
  ) => Promise<void>;
};

export default function SkizzeModal({ open, onClose, item, onSave }: Props) {
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && item) {
      setNotes(item.skizze_notes ?? "");
      setTodos(item.skizze_todos ?? []);
      setComment(item.skizze_comment ?? "");
    }
  }, [open, item]);

  const handleAddTodo = () => {
    const t = newTodo.trim();
    if (t) {
      setTodos((prev) => [...prev, t]);
      setNewTodo("");
    }
  };

  const handleRemoveTodo = (index: number) => {
    setTodos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    try {
      await onSave(item.id, { notes, todos, comment });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  useEscapeAndLock(open, onClose);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skizze-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="shrink-0 border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h2 id="skizze-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Als Skizze anlegen
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
          {item && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {item.title}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div>
              <label htmlFor="skizze-notes" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Ausführliche Notizen
              </label>
              <textarea
                id="skizze-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Konzept, Ablauf, Besonderheiten …"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                To-dos
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTodo())}
                    placeholder="To-do eingeben und hinzufügen"
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddTodo}
                    className="shrink-0 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  >
                    + To-do
                  </button>
                </div>
                {todos.length > 0 && (
                  <ul className="space-y-1.5">
                    {todos.map((todo, i) => (
                      <li key={i} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/80">
                        <span className="flex-1">{todo}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTodo(i)}
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
            </div>
            <div>
              <label htmlFor="skizze-comment" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Kommentar
              </label>
              <textarea
                id="skizze-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Anmerkungen, Hinweise …"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Speichern …" : "Als Skizze speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
