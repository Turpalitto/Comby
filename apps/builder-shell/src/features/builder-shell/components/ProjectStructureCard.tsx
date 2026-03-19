"use client";

import type { ProjectKind } from "@combi/shared";
import { modeSummaries } from "../data/mode-options";

interface ProjectStructureCardProps {
  kind: ProjectKind;
}

function FileEntry({ path }: { path: string }) {
  const isDir = path.endsWith("/");
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5">
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
          isDir
            ? "bg-amber-50 text-amber-500"
            : "bg-teal-50 text-accent"
        ].join(" ")}
      >
        {isDir ? "📁" : "📄"}
      </span>
      <code className="truncate font-mono text-xs text-slate-700">{path}</code>
      <span
        className={[
          "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
          isDir
            ? "bg-amber-50 text-amber-600"
            : "bg-teal-50 text-accent"
        ].join(" ")}
      >
        {isDir ? "dir" : "file"}
      </span>
    </div>
  );
}

export function ProjectStructureCard({ kind }: ProjectStructureCardProps) {
  const summary = modeSummaries[kind];

  return (
    <section className="animate-fade-in rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-panel backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
            File Plan
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            Initial structure
          </h2>
        </div>
        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-500">
          MVP scaffold
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {summary.folders.map((path) => (
          <FileEntry key={path} path={path} />
        ))}
      </div>
    </section>
  );
}
