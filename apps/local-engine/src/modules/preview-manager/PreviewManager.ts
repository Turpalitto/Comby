import type { PreviewSession, PreviewTarget, ProjectKind } from "@combi/shared";

export class PreviewManager {
  createSession(projectKind: ProjectKind, target: PreviewTarget): PreviewSession {
    return {
      id: createSessionId(projectKind),
      projectKind,
      status: "preparing",
      url: `http://localhost:4173/preview/${projectKind}`,
      entryFile: target.entryFile
    };
  }
}

function createSessionId(projectKind: ProjectKind): string {
  return `${projectKind}-${Date.now()}`;
}

