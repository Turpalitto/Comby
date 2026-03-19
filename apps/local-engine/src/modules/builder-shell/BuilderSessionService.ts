import type { BuilderIdeaInput, PipelineDraft, PreviewSession } from "@combi/shared";
import { GenerationPipeline } from "../generation-pipeline/GenerationPipeline";
import { PreviewManager } from "../preview-manager/PreviewManager";

export interface BuilderRunResult {
  draft: PipelineDraft;
  preview: PreviewSession;
}

export class BuilderSessionService {
  constructor(
    private readonly pipeline = new GenerationPipeline(),
    private readonly previewManager = new PreviewManager()
  ) {}

  createDraft(input: BuilderIdeaInput): BuilderRunResult {
    const draft = this.pipeline.run(input);
    const preview = this.previewManager.createSession(
      draft.spec.kind,
      draft.previewTarget
    );

    return {
      draft,
      preview
    };
  }
}

