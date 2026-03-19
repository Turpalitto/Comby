# COMBI MVP Architecture

## Goal

Build a local AI builder that feels fast and focused like Rork, but only for:

- websites
- web apps
- simple 2D browser games

Out of scope for MVP:

- publishing
- app store
- login
- cloud infrastructure
- collaboration

## High-level structure

```text
COMBI/
  apps/
    builder-shell/
    local-engine/
  packages/
    shared/
  docs/
```

## Module split

### 1. Builder shell

Responsibility:

- accept user idea/prompt
- show selected mode or auto-detected mode
- display generation progress
- render preview pane
- manage local builder session state

Lives in:

- `apps/builder-shell`

### 2. Website mode

Responsibility:

- define website-specific defaults
- shape website specs and file plans
- later provide templates/components/prompt rules

Lives in:

- `apps/local-engine/src/modules/modes/website`

### 3. App mode

Responsibility:

- define SPA/web-app defaults
- shape interaction-oriented specs
- later provide component/data-flow scaffolds

Lives in:

- `apps/local-engine/src/modules/modes/app`

### 4. Game mode

Responsibility:

- define simple 2D browser-game defaults
- shape loop/input/render requirements
- later provide scene/gameplay scaffolds

Lives in:

- `apps/local-engine/src/modules/modes/game`

### 5. Preview manager

Responsibility:

- prepare preview sessions for generated output
- decide preview strategy per mode
- later start/stop local preview runtimes

Lives in:

- `apps/local-engine/src/modules/preview-manager`

### 6. Generation pipeline

Responsibility:

- orchestrate the builder flow from prompt to preview target
- keep each step isolated and replaceable
- avoid coupling UI to generation internals

Lives in:

- `apps/local-engine/src/modules/generation-pipeline`

## Pipeline

### `idea`

Raw user intent from the shell.

Example:

- "make a landing page for a coffee brand"
- "build a kanban web app"
- "create a tiny top-down browser game"

### `type detection`

Maps the idea to one of:

- `website`
- `app`
- `game`

This step should stay lightweight and replaceable. In MVP it can start with heuristics, then later move to an LLM-assisted classifier.

### `spec`

Converts the idea into a normalized project spec:

- project type
- title
- summary
- key features
- constraints
- preview strategy

The spec becomes the contract between planning and generation.

### `file plan`

Builds a deterministic list of files to create.

Examples:

- website: `index.html`, `src/main.ts`, `src/styles.css`
- app: `src/App.tsx`, `src/routes`, `src/components`
- game: `src/game/Game.ts`, `src/game/scenes`, `src/assets`

This keeps generation concrete and easier to inspect.

### `generation`

Creates file contents based on the spec and file plan.

Not implemented yet in this stage. The architecture already reserves a dedicated step and contracts for it.

### `preview`

Prepares a local preview target:

- entry file
- preview strategy
- local URL/session

Preview is mandatory for MVP, so it is treated as a first-class module rather than a side effect.

## Why this layout

- clean separation between UI and generation engine
- shared contracts prevent drift between apps
- modes stay isolated, so adding a future `editor mode` or `marketing site mode` is easy
- preview stays independent from generation details
- enough structure for growth, but still small enough for MVP

## Next implementation phases

1. wire builder shell to local engine API
2. implement real mode-aware spec builders
3. implement file generation into a local workspace
4. implement preview session startup and refresh
5. add iterative regeneration/edit loop

