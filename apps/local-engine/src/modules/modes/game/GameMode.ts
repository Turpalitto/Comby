import type { ModeDefinition } from "@combi/shared";

export const gameMode: ModeDefinition = {
  kind: "game",
  label: "2D Browser Game",
  summary: "Simple canvas or DOM-based games with a local browser preview.",
  previewStrategy: "browser-game"
};

