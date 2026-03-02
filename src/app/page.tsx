"use client";

import { useState } from "react";
import GrundideenBoard from "@/components/GrundideenBoard";
import PillarPanel from "@/components/PillarPanel";
import VideoideenBoard from "@/components/VideoideenBoard";
import type { Idea } from "@/components/IdeaCard";

export default function Home() {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  return (
    <div className="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      <PillarPanel />
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-5 md:flex-row md:p-6">
        <aside className="flex min-h-[280px] shrink-0 flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 md:w-[380px]">
          <GrundideenBoard
            selectedIdeaId={selectedIdea?.id ?? null}
            onSelectIdea={setSelectedIdea}
          />
        </aside>
        <main className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <VideoideenBoard
            selectedIdeaId={selectedIdea?.id ?? null}
            selectedIdeaTitle={selectedIdea?.title ?? null}
            onClearIdeaFilter={() => setSelectedIdea(null)}
          />
        </main>
      </div>
    </div>
  );
}
