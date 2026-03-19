import { getMode } from "../../shared/modeRegistry";
export class CreateProjectSpecStep {
    execute(input, detection) {
        const mode = getMode(detection.kind);
        const name = createProjectName(input.prompt, detection.kind);
        return {
            kind: detection.kind,
            name,
            summary: input.prompt,
            features: defaultFeaturesByKind[detection.kind],
            constraints: [
                "Local-first MVP",
                "Preview required",
                "No auth, cloud, publishing, or collaboration"
            ],
            previewStrategy: mode.previewStrategy
        };
    }
}
const defaultFeaturesByKind = {
    website: ["hero section", "content sections", "responsive layout"],
    app: ["core screen flow", "interactive UI", "local state"],
    game: ["main loop", "input handling", "basic scoring or progression"]
};
function createProjectName(prompt, kind) {
    const words = prompt
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ""));
    const cleaned = words.filter(Boolean).join(" ");
    return cleaned || `New ${kind}`;
}
