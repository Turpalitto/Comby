import type { PreviewStrategy, ProjectKind } from "./modes";

export interface TypeDetectionResult {
  kind: ProjectKind;
  confidence: number;
  reasons: string[];
}

export interface ProjectSpec {
  kind: ProjectKind;
  name: string;
  summary: string;
  features: string[];
  constraints: string[];
  previewStrategy: PreviewStrategy;
}

export interface PlannedFile {
  path: string;
  purpose: string;
}

export interface FilePlan {
  rootDir: string;
  files: PlannedFile[];
}

export interface GeneratedProject {
  workspacePath: string;
  generatedFiles: string[];
}

export interface PreviewTarget {
  entryFile: string;
  strategy: PreviewStrategy;
}

export interface PipelineDraft {
  detection: TypeDetectionResult;
  spec: ProjectSpec;
  filePlan: FilePlan;
  previewTarget: PreviewTarget;
}

