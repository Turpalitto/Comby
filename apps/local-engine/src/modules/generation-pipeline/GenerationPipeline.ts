import type { BuilderIdeaInput, PipelineDraft } from "@combi/shared";
import { CreateFilePlanStep } from "./steps/createFilePlan";
import { CreateProjectSpecStep } from "./steps/createProjectSpec";
import { DetectProjectTypeStep } from "./steps/detectProjectType";
import { GenerateFilesStep } from "./steps/generateFiles";
import { PreparePreviewStep } from "./steps/preparePreview";

export class GenerationPipeline {
  constructor(
    private readonly detectProjectType = new DetectProjectTypeStep(),
    private readonly createProjectSpec = new CreateProjectSpecStep(),
    private readonly createFilePlan = new CreateFilePlanStep(),
    private readonly generateFiles = new GenerateFilesStep(),
    private readonly preparePreview = new PreparePreviewStep()
  ) {}

  run(input: BuilderIdeaInput): PipelineDraft {
    const detection = this.detectProjectType.execute(input);
    const spec = this.createProjectSpec.execute(input, detection);
    const filePlan = this.createFilePlan.execute(spec);

    this.generateFiles.execute(spec, filePlan);

    const previewTarget = this.preparePreview.execute(spec, filePlan);

    return {
      detection,
      spec,
      filePlan,
      previewTarget
    };
  }
}

