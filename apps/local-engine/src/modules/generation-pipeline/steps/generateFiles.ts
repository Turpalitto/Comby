import type { FilePlan, GeneratedProject, ProjectSpec } from "@combi/shared";

export class GenerateFilesStep {
  execute(spec: ProjectSpec, filePlan: FilePlan): GeneratedProject {
    return {
      workspacePath: `projects/${filePlan.rootDir}`,
      generatedFiles: filePlan.files.map((file) => file.path)
    };
  }
}

