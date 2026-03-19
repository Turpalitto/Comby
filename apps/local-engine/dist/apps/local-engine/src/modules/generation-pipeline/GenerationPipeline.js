import { CreateFilePlanStep } from "./steps/createFilePlan";
import { CreateProjectSpecStep } from "./steps/createProjectSpec";
import { DetectProjectTypeStep } from "./steps/detectProjectType";
import { GenerateFilesStep } from "./steps/generateFiles";
import { PreparePreviewStep } from "./steps/preparePreview";
export class GenerationPipeline {
    detectProjectType;
    createProjectSpec;
    createFilePlan;
    generateFiles;
    preparePreview;
    constructor(detectProjectType = new DetectProjectTypeStep(), createProjectSpec = new CreateProjectSpecStep(), createFilePlan = new CreateFilePlanStep(), generateFiles = new GenerateFilesStep(), preparePreview = new PreparePreviewStep()) {
        this.detectProjectType = detectProjectType;
        this.createProjectSpec = createProjectSpec;
        this.createFilePlan = createFilePlan;
        this.generateFiles = generateFiles;
        this.preparePreview = preparePreview;
    }
    run(input) {
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
