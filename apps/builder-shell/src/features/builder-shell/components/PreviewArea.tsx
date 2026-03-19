"use client";

import type { ProjectKind } from "@combi/shared";
import { modeSummaries } from "../data/mode-options";

interface PreviewAreaProps {
  kind: ProjectKind;
  prompt: string;
  generatedAt?: string;
}

const strategyLabel: Record<ProjectKind, string> = {
  website: "static-site",
  app: "single-page-app",
  game: "browser-game"
};

const previewHint: Record<ProjectKind, string> = {
  website: "Static HTML/CSS/JS will render here after generation.",
  app: "React app output will mount in this iframe.",
  game: "Canvas game loop will run inside this frame."
};

export function PreviewArea({ kind, prompt, generatedAt }: PreviewAreaProps) {
  const summary = modeSummaries[kind];

  return (
    <aside className="flex h-full flex-col rounded-[24px] border border-slate-900/12 bg-slate-950 shadow-panel overflow-hidden">
      {/* Browser chrome bar */}
      <div className="flex items-center gap-2 border-b border-white/8 bg-slate-900/80 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-300/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <div className="ml-3 flex-1 rounded-full bg-white/8 px-3 py-1 text-xs text-slate-400">
          localhost:4173 / preview
        </div>
        <span className="ml-2 rounded-full bg-white/8 px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {strategyLabel[kind]}
        </span>
      </div>

      {/* Preview content area */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(45,212,191,0.10),transparent_70%)]" />

        {generatedAt ? (
          // Post-generate state
          <div className="relative w-full animate-fade-in space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Preview Placeholder
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {summary.icon} {kind} output
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {previewHint[kind]}
              </p>
            </div>

            {prompt.trim() && (
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Idea
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {prompt.trim()}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-2.5 text-xs text-slate-500">
              <span>Shell draft ready</span>
              <span className="font-medium text-slate-300">{generatedAt}</span>
            </div>
          </div>
        ) : (
          // Idle state
          <div className="relative flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
              {summary.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Preview Panel
              </p>
              <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-slate-500">
                Enter an idea and hit&nbsp;
                <span className="font-medium text-teal-400">Generate</span>
                &nbsp;to see a preview here.
              </p>
            </div>

            {/* Dashed placeholder lines */}
            <div className="mt-2 w-full space-y-2 opacity-30">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 rounded-full bg-white/20"
                  style={{ width: `${70 - i * 8}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
