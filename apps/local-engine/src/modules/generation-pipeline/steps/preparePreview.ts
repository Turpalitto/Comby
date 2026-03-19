import type { FilePlan, PreviewTarget, ProjectSpec } from "@combi/shared";

export class PreparePreviewStep {
  execute(spec: ProjectSpec, filePlan: FilePlan): PreviewTarget {
    const entryFile =
      filePlan.files.find((file) => file.path.endsWith(".html"))?.path ?? "index.html";

    return {
      entryFile,
      strategy: spec.previewStrategy
    };
  }
}

