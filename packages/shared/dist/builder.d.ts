import type { ProjectKind } from "./modes";
export interface BuilderIdeaInput {
    prompt: string;
    preferredKind?: ProjectKind;
}
export interface BuilderSessionDraft {
    prompt: string;
    selectedKind: ProjectKind | "auto";
    previewUrl?: string;
}
