"use client";

import type { ProjectKind } from "@combi/shared";
import { ModeTabs } from "./ModeTabs";
import type { BuilderShellMode } from "../state/createBuilderShellState";
import { modeSummaries } from "../data/mode-options";

interface ShellTopBarProps {
  selectedMode: BuilderShellMode;
  resolvedKind: ProjectKind;
  onModeChange: (value: BuilderShellMode) => void;
}

export function ShellTopBar({
  selectedMode,
  resolvedKind,
  onModeChange
}: ShellTopBarProps) {
  const summary = modeSummaries[resolvedKind];

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white shadow-md shadow-teal-900/20">
            C
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              COMBI
            </p>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900">
              Local AI Builder
            </h1>
          </div>
        </div>

        {/* Resolved kind badge */}
        <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm text-slate-600 shadow-sm backdrop-blur">
          <span className="text-base">{summary.icon}</span>
          <span className="text-slate-500">Detected:</span>
          <span className="font-semibold text-accent capitalize">{resolvedKind}</span>
          <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
        </div>
      </div>

      <ModeTabs value={selectedMode} onChange={onModeChange} />
    </header>
  );
}
