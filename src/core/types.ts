// ============================================================
// CORE TYPES — local-ai-builder
// ============================================================

// ─── Mode & Type ────────────────────────────────────────────
export type ProjectMode = 'auto' | 'website' | 'app' | 'game';
export type ProjectType = 'website' | 'app' | 'game';

// ─── Build Pipeline Status ───────────────────────────────────
export type BuildStatus =
  | 'idle'
  | 'detecting'
  | 'speccing'
  | 'planning'
  | 'generating'
  | 'ready'
  | 'error';

// ─── User Input ──────────────────────────────────────────────
export interface UserIdea {
  raw: string;
  mode: ProjectMode;
}

// ─── Specs ───────────────────────────────────────────────────

export interface BaseSpec {
  type: ProjectType;
  title: string;
  description: string;
  primaryColor: string;
  features: string[];
}

export interface WebsiteSpec extends BaseSpec {
  type: 'website';
  sections: Array<'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'footer'>;
  tone: 'professional' | 'casual' | 'playful' | 'minimal';
}

export interface AppSpec extends BaseSpec {
  type: 'app';
  layout: 'sidebar' | 'topbar' | 'both';
  views: string[];
  widgets: Array<'cards' | 'table' | 'chart' | 'list'>;
}

export interface GameSpec extends BaseSpec {
  type: 'game';
  genre: 'platformer' | 'shooter' | 'puzzle' | 'runner' | 'arcade';
  player: {
    movement: 'keyboard' | 'mouse' | 'touch';
    sprite: string;
  };
  mechanics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export type ProjectSpec = WebsiteSpec | AppSpec | GameSpec;

// ─── File Plan ───────────────────────────────────────────────

export type FileType = 'component' | 'page' | 'style' | 'asset' | 'config' | 'logic' | 'markup';

export interface PlannedFile {
  path: string;
  type: FileType;
  description: string;
  templateKey?: string;      // ссылка на шаблон (template mode)
  content?: string;          // предзаполненный контент
  // ── AI fields (Stage 9) ──────────────────────────────────
  aiPrompt?: string;         // что именно сгенерировать
  dependencies?: string[];   // файлы, от которых зависит этот
}

export interface FilePlan {
  files: PlannedFile[];
  entryPoint: string;        // путь к главному файлу для preview
  // ── AI fields (Stage 9) ──────────────────────────────────
  projectContext?: string;   // общий контекст для всех AI-запросов
  generationMode?: 'template' | 'ai' | 'hybrid';
}

// ─── Generated Project ───────────────────────────────────────

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratedProject {
  id: string;
  spec: ProjectSpec;
  filePlan: FilePlan;
  files: GeneratedFile[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Pipeline State ──────────────────────────────────────────

export interface PipelineState {
  status: BuildStatus;
  currentStep?: string;
  idea?: UserIdea;
  detectedType?: ProjectType;
  spec?: ProjectSpec;
  filePlan?: FilePlan;
  project?: GeneratedProject;
  error?: string;
  progress: number; // 0–100
}

// ─── Generation Interfaces (stub для будущих этапов) ─────────

export interface ITypeDetector {
  detect(idea: UserIdea): ProjectType;
}

export interface ISpecGenerator {
  generate(idea: UserIdea, type: ProjectType): ProjectSpec;
}

export interface IFilePlanBuilder {
  build(spec: ProjectSpec): FilePlan;
}

export interface IFileGenerator {
  generate(plan: FilePlan, spec: ProjectSpec): GeneratedFile[];
}

// ─── Preview ─────────────────────────────────────────────────

export type PreviewMode = 'iframe' | 'canvas';

export interface PreviewConfig {
  mode: PreviewMode;
  entryFile: string;
  projectId: string;
}
