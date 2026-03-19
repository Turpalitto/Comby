"use client";

import { useMemo, useState } from "react";
import { IdeaSidebar } from "./components/IdeaSidebar";
import { PreviewArea } from "./components/PreviewArea";
import { ProjectStructureCard } from "./components/ProjectStructureCard";
import { ProjectSummaryCard } from "./components/ProjectSummaryCard";
import { ShellTopBar } from "./components/ShellTopBar";
import {
  createBuilderShellState,
  resolveProjectKind,
  type BuilderShellMode,
  type BuilderShellState
} from "./state/createBuilderShellState";

export function BuilderShellScreen() {
  const [state, setState] = useState<BuilderShellState>(createBuilderShellState);

  const resolvedKind = useMemo(
    () => resolveProjectKind(state.selectedKind, state.prompt),
    [state.prompt, state.selectedKind]
  );

  function handlePromptChange(prompt: string) {
    setState((s) => ({ ...s, prompt }));
  }

  function handleModeChange(selectedKind: BuilderShellMode) {
    setState((s) => ({ ...s, selectedKind }));
  }

  function handleGenerate() {
    setState((s) => ({
      ...s,
      generatedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }));
  }

  return (
    <main className="min-h-dvh px-3 py-4 md:px-5 md:py-5">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[1680px] flex-col gap-5 rounded-[28px] border border-white/60 bg-white/30 p-4 shadow-panel backdrop-blur-xl md:p-5">
        {/* Top bar */}
        <ShellTopBar
          selectedMode={state.selectedKind}
          resolvedKind={resolvedKind}
          onModeChange={handleModeChange}
        />

        {/* Main 3-column layout */}
        <section className="grid flex-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_380px]">
          {/* Left: idea input + generate */}
          <IdeaSidebar
            state={state}
            onPromptChange={handlePromptChange}
            onGenerate={handleGenerate}
          />

          {/* Center: project info */}
          <div className="flex flex-col gap-4">
            <ProjectSummaryCard kind={resolvedKind} prompt={state.prompt} />
            <ProjectStructureCard kind={resolvedKind} />
          </div>

          {/* Right: preview */}
          <PreviewArea
            kind={resolvedKind}
            prompt={state.prompt}
            generatedAt={state.generatedAt}
          />
        </section>
      </div>
    </main>
  );
}
