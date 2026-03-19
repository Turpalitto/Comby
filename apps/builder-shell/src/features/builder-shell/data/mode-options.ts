import type { ProjectKind } from "@combi/shared";
import type { BuilderShellMode } from "../state/createBuilderShellState";

export interface ModeOption {
  id: BuilderShellMode;
  label: string;
  caption: string;
  icon: string;
}

export interface ModeSummary {
  icon: string;
  title: string;
  description: string;
  highlights: string[];
  folders: string[];
}

export const modeOptions: ModeOption[] = [
  {
    id: "auto",
    label: "Auto",
    caption: "Detect best type from your idea",
    icon: "✦"
  },
  {
    id: "website",
    label: "Website",
    caption: "Landing pages, marketing, docs",
    icon: "🌐"
  },
  {
    id: "app",
    label: "App",
    caption: "Interactive tools & workflows",
    icon: "⚡"
  },
  {
    id: "game",
    label: "Game",
    caption: "Simple 2D browser experiences",
    icon: "🎮"
  }
];

export const modeSummaries: Record<ProjectKind, ModeSummary> = {
  website: {
    icon: "🌐",
    title: "Website project",
    description:
      "A focused content-led site with strong visual hierarchy, fast static preview, and responsive layout.",
    highlights: [
      "Responsive entry page with hero",
      "Content sections & typography",
      "Static preview-friendly structure"
    ],
    folders: [
      "index.html",
      "src/main.ts",
      "src/styles.css",
      "src/sections/"
    ]
  },
  app: {
    icon: "⚡",
    title: "Web app project",
    description:
      "A small interactive product shell organized around flows, reusable components, and local state management.",
    highlights: [
      "Primary app shell & routing",
      "Interactive screen flow",
      "Composable UI component tree"
    ],
    folders: [
      "index.html",
      "src/main.tsx",
      "src/App.tsx",
      "src/components/",
      "src/features/"
    ]
  },
  game: {
    icon: "🎮",
    title: "2D browser game",
    description:
      "A lightweight 2D game setup built for keyboard or pointer input, main loop, and instant local preview.",
    highlights: [
      "Game loop bootstrap",
      "Scene & entity structure",
      "Browser-friendly runtime"
    ],
    folders: [
      "index.html",
      "src/main.ts",
      "src/game/Game.ts",
      "src/game/scenes/",
      "src/game/entities/"
    ]
  }
};
