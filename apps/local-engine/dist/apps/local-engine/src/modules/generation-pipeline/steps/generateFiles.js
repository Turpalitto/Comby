export class GenerateFilesStep {
    execute(spec, filePlan) {
        return {
            workspacePath: `projects/${filePlan.rootDir}`,
            generatedFiles: filePlan.files.map((file) => file.path)
        };
    }
}
