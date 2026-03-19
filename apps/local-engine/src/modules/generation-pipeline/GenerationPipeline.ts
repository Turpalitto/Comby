import type { BuilderIdeaInput, GeneratedFile, PipelineDraft } from "@combi/shared";
import { CreateFilePlanStep } from "./steps/createFilePlan";
import { CreateProjectSpecStep } from "./steps/createProjectSpec";
import { DetectProjectTypeStep } from "./steps/detectProjectType";
import { GenerateFilesStep } from "./steps/generateFiles";
import { PreparePreviewStep } from "./steps/preparePreview";

export interface PipelineResult extends PipelineDraft {
  generatedFiles: GeneratedFile[];
}

export class GenerationPipeline {
  constructor(
    private readonly detectProjectType = new DetectProjectTypeStep(),
    private readonly createProjectSpec = new CreateProjectSpecStep(),
    private readonly createFilePlan    = new CreateFilePlanStep(),
    private readonly generateFiles     = new GenerateFilesStep(),
    private readonly preparePreview    = new PreparePreviewStep()
  ) {}

  async run(input: BuilderIdeaInput): Promise<PipelineResult> {
    const detection     = this.detectProjectType.execute(input);
    const spec          = this.createProjectSpec.execute(input, detection);
    const filePlan      = this.createFilePlan.execute(spec);
    const generated     = await this.generateFiles.execute(spec, filePlan);
    const previewTarget = this.preparePreview.execute(spec, filePlan);

    return {
      detection,
      spec,
      filePlan,
      previewTarget,
      generatedFiles: generated.files,
    };
  }
}
