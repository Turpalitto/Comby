import { GenerationPipeline } from "../generation-pipeline/GenerationPipeline";
import { PreviewManager } from "../preview-manager/PreviewManager";
export class BuilderSessionService {
    pipeline;
    previewManager;
    constructor(pipeline = new GenerationPipeline(), previewManager = new PreviewManager()) {
        this.pipeline = pipeline;
        this.previewManager = previewManager;
    }
    createDraft(input) {
        const draft = this.pipeline.run(input);
        const preview = this.previewManager.createSession(draft.spec.kind, draft.previewTarget);
        return {
            draft,
            preview
        };
    }
}
