import type { ModeDefinition, ProjectKind } from "@combi/shared";
import { appMode } from "../modes/app/AppMode";
import { gameMode } from "../modes/game/GameMode";
import { websiteMode } from "../modes/website/WebsiteMode";

const registry: Record<ProjectKind, ModeDefinition> = {
  website: websiteMode,
  app: appMode,
  game: gameMode
};

export function listModes(): ModeDefinition[] {
  return Object.values(registry);
}

export function getMode(kind: ProjectKind): ModeDefinition {
  return registry[kind];
}

