import type { BuilderIdeaInput, TypeDetectionResult } from "@combi/shared";

export class DetectProjectTypeStep {
  execute(input: BuilderIdeaInput): TypeDetectionResult {
    if (input.preferredKind) {
      return {
        kind: input.preferredKind,
        confidence: 0.99,
        reasons: ["Explicit mode selected by user."]
      };
    }

    const prompt = input.prompt.toLowerCase();

    if (/(game|platformer|arcade|top-down|puzzle)/.test(prompt)) {
      return {
        kind: "game",
        confidence: 0.84,
        reasons: ["Game-related keywords found in prompt."]
      };
    }

    if (/(dashboard|app|workspace|kanban|admin|crm)/.test(prompt)) {
      return {
        kind: "app",
        confidence: 0.81,
        reasons: ["App-oriented interaction keywords found in prompt."]
      };
    }

    return {
      kind: "website",
      confidence: 0.72,
      reasons: ["Defaulted to website because the prompt looks content-oriented."]
    };
  }
}

