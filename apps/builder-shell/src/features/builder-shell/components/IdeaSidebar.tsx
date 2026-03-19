"use client";

import type { BuilderShellState } from "../state/createBuilderShellState";

interface IdeaSidebarProps {
  state: BuilderShellState;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
}

const suggestions = [
  { emoji: "🌿", text: "Landing page for a climate-tech startup with pricing" },
  { emoji: "📋", text: "Kanban board app for a product team" },
  { emoji: "🎮", text: "Top-down dungeon crawler browser game" }
];

export function IdeaSidebar({
  state,
  onPromptChange,
  onGenerate
}: IdeaSidebarProps) {
  const canGenerate = state.prompt.trim().length > 0;

  return (
    <aside className="flex h-full flex-col gap-5 rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-panel backdrop-blur">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
          Idea Input
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
          Describe what to build
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          A natural-language idea. The builder detects the type, generates a spec, plans files, and opens a preview.
        </p>
      </div>

      {/* Textarea */}
      <label className="block flex-1">
        <span className="mb-2 block text-xs font-semibold text-slate-600">
          Your idea
        </span>
        <textarea
          value={state.prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g. Build a polished landing page for a climate-tech startup with a hero, pricing table, and FAQ section..."
          className="h-full min-h-[180px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm leading-relaxed text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-3 focus:ring-teal-100"
        />
      </label>

      {/* Starters */}
      <div>
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Quick starters
        </p>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => onPromptChange(s.text)}
              className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm text-slate-600 transition-all hover:border-accent/30 hover:bg-teal-50/50 hover:text-slate-800"
            >
              <span className="mt-0.5 shrink-0 text-base leading-none">{s.emoji}</span>
              <span className="leading-snug">{s.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <div className="mt-auto">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className={[
            "relative w-full overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-teal-200",
            canGenerate
              ? "bg-accent text-white shadow-md shadow-teal-900/20 hover:bg-accent-strong hover:shadow-lg"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          ].join(" ")}
        >
          <span className="flex items-center justify-center gap-2">
            <span>✦</span>
            Generate
          </span>
        </button>
        {state.generatedAt && (
          <p className="mt-2.5 text-center text-xs text-slate-400">
            Last run at <span className="font-medium text-slate-600">{state.generatedAt}</span>
          </p>
        )}
        {!state.generatedAt && (
          <p className="mt-2.5 text-center text-xs text-slate-400">
            Type an idea above to enable generation
          </p>
        )}
      </div>
    </aside>
  );
}
