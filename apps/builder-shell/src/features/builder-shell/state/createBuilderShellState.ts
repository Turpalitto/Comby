import type { BuilderSessionDraft, ProjectKind } from "@combi/shared";

export type BuilderShellMode = BuilderSessionDraft["selectedKind"];

export interface BuilderShellState extends BuilderSessionDraft {
  generatedAt?: string;
}

export function createBuilderShellState(): BuilderShellState {
  return {
    prompt: "",
    selectedKind: "auto"
  };
}

export function resolveProjectKind(mode: BuilderShellMode, prompt: string): ProjectKind {
  if (mode !== "auto") {
    return mode;
  }

  const normalizedPrompt = prompt.toLowerCase();

  if (/(game|platformer|arcade|puzzle|top-down)/.test(normalizedPrompt)) {
    return "game";
  }

  if (/(app|dashboard|workspace|crm|kanban|tool)/.test(normalizedPrompt)) {
    return "app";
  }

  return "website";
}

