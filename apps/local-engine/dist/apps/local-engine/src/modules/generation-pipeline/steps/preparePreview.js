export class PreparePreviewStep {
    execute(spec, filePlan) {
        const entryFile = filePlan.files.find((file) => file.path.endsWith(".html"))?.path ?? "index.html";
        return {
            entryFile,
            strategy: spec.previewStrategy
        };
    }
}
