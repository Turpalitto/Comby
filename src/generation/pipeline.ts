import type {
  UserIdea,
  ProjectType,
  ProjectSpec,
  FilePlan,
  GeneratedProject,
  PipelineState,
  ITypeDetector,
} from '@/core/types';
import type { IGenerationService } from './service';
import { generateProjectId } from '@/core/utils';

// ─── Pipeline ─────────────────────────────────────────────────

export class GenerationPipeline {
  constructor(
    private detector: ITypeDetector,
    private service:  IGenerationService,
    private onProgress?: (state: PipelineState) => void,
  ) {}

  async run(idea: UserIdea): Promise<GeneratedProject> {
    const emit = (partial: Partial<PipelineState>) =>
      this.onProgress?.({ progress: 0, ...partial } as PipelineState);

    // ── 1. Detect type ────────────────────────────────────────
    emit({ status: 'detecting', currentStep: 'Detecting project type…', progress: 15 });
    await tick();

    const type: ProjectType =
      idea.mode !== 'auto'
        ? (idea.mode as ProjectType)
        : this.detector.detect(idea);

    // ── 2. Build spec ─────────────────────────────────────────
    emit({ status: 'speccing', currentStep: 'Building spec…', detectedType: type, progress: 35 });
    await tick();

    const spec: ProjectSpec = await this.service.generateSpecFromIdea(idea, type);

    // ── 3. Plan files ─────────────────────────────────────────
    emit({ status: 'planning', currentStep: 'Planning files…', spec, progress: 55 });
    await tick();

    const filePlan: FilePlan = await this.service.buildFilePlan(spec);

    // ── 4. Generate files ─────────────────────────────────────
    const genLabel = this.service.mode === 'ai' || this.service.mode === 'hybrid'
      ? 'Generating with AI…'
      : 'Generating project…';

    emit({ status: 'generating', currentStep: genLabel, filePlan, progress: 80 });
    await tick();

    const files = await this.service.generateFilesFromPlan(filePlan, spec);

    if (files.length === 0) {
      throw new Error('Generator produced no files.');
    }

    const project: GeneratedProject = {
      id:        generateProjectId(),
      spec,
      filePlan,
      files,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    emit({ status: 'ready', currentStep: 'Ready', project, progress: 100 });
    return project;
  }
}

// ─── Factory ──────────────────────────────────────────────────

export type ServiceMode = 'template' | 'ai';

export async function getPipeline(
  onProgress?: (state: PipelineState) => void,
  serviceMode: ServiceMode = 'template',
): Promise<GenerationPipeline> {
  const { TypeDetector }           = await import('@/modes/detector');
  const { templateService }        = await import('./service');
  const { aiService }              = await import('./aiService');

  const service = serviceMode === 'ai' ? aiService : templateService;

  return new GenerationPipeline(
    new TypeDetector(),
    service,
    onProgress,
  );
}

function tick(): Promise<void> {
  return new Promise(r => setTimeout(r, 350));
}
