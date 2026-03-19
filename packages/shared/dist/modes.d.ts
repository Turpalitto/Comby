export type ProjectKind = "website" | "app" | "game";
export type PreviewStrategy = "static-site" | "single-page-app" | "browser-game";
export interface ModeDefinition {
    kind: ProjectKind;
    label: string;
    summary: string;
    previewStrategy: PreviewStrategy;
}
