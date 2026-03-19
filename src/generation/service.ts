/**
 * Generation Service Layer
 *
 * Defines IGenerationService — the contract every generation backend must satisfy.
 * TemplateGenerationService wraps the existing template pipeline (no AI, no network).
 * AIGenerationService (Stage 9) will implement the same interface for LLM-driven output.
 *
 * Pipeline picks a service at runtime; the rest of the code is unaware of which one runs.
 */

import type {
  UserIdea,
  ProjectType,
  ProjectSpec,
  FilePlan,
  GeneratedFile,
} from '@/core/types';

// ─── Contract ─────────────────────────────────────────────────

export interface IGenerationService {
  /** Convert a raw idea + detected type → structured spec */
  generateSpecFromIdea(idea: UserIdea, type: ProjectType): Promise<ProjectSpec>;

  /** Convert a spec → file plan (list of files to produce) */
  buildFilePlan(spec: ProjectSpec): Promise<FilePlan>;

  /** Render / generate each file described in the plan */
  generateFilesFromPlan(plan: FilePlan, spec: ProjectSpec): Promise<GeneratedFile[]>;

  readonly mode: 'template' | 'ai' | 'hybrid';
}

// ─── Template implementation (current default) ────────────────

import { normaliseIdeaToSpec } from '@/core/specNormaliser';
import { FilePlanBuilder }     from './filePlan';
import { FileGenerator }       from './generator';

const planBuilder = new FilePlanBuilder();
const fileGen     = new FileGenerator();

export class TemplateGenerationService implements IGenerationService {
  readonly mode = 'template' as const;

  async generateSpecFromIdea(idea: UserIdea, type: ProjectType): Promise<ProjectSpec> {
    return normaliseIdeaToSpec(idea, type);
  }

  async buildFilePlan(spec: ProjectSpec): Promise<FilePlan> {
    const plan = planBuilder.build(spec);
    return { ...plan, generationMode: 'template' };
  }

  async generateFilesFromPlan(plan: FilePlan, spec: ProjectSpec): Promise<GeneratedFile[]> {
    return fileGen.generate(plan, spec);
  }
}

// ─── Singleton ────────────────────────────────────────────────
export const templateService = new TemplateGenerationService();
