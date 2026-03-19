import type { ProjectKind } from "./modes";
export type PreviewStatus = "idle" | "preparing" | "ready" | "failed";
export interface PreviewSession {
    id: string;
    projectKind: ProjectKind;
    status: PreviewStatus;
    url?: string;
    entryFile?: string;
}
