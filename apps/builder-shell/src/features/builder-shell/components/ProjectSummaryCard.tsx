"use client";

import type { ProjectKind } from "@combi/shared";
import { modeSummaries } from "../data/mode-options";

interface ProjectSummaryCardProps {
  kind: ProjectKind;
  prompt: string;
}

const kindColors: Record<ProjectKind, string> = {
  website: "bg-sky-50 border-sky-200 text-sky-700",
  app: "bg-violet-50 border-violet-200 text-violet-700",
  game: "bg-orange-50 border-orange-200 text-orange-700"
};

export function ProjectSummaryCard({ kind, prompt }: ProjectSummaryCardProps) {
  const summary = modeSummaries[kind];
  const displayTitle = prompt.trim() || summary.title;

  return (
    <section className="animate-fade-in rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-panel backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
              Project Overview
            </p>
          </div>
          <h2 className="mt-2 line-clamp-2 text-xl font-bold tracking-tight text-slate-900">
            {displayTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {summary.description}
          </p>
        </div>

        <span
          className={[
            "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold",
            kindColors[kind]
          ].join(" ")}
        >
          <span className="text-base leading-none">{summary.icon}</span>
          <span className="capitalize">{kind}</span>
        </span>
      </div>

      {/* Highlights */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {summary.highlights.map((item, i) => (
          <div
            key={item}
            className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
              {i + 1}
            </span>
            <span className="text-sm leading-snug text-slate-600">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
