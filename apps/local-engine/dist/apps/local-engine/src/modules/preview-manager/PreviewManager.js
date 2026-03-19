export class PreviewManager {
    createSession(projectKind, target) {
        return {
            id: createSessionId(projectKind),
            projectKind,
            status: "preparing",
            url: `http://localhost:4173/preview/${projectKind}`,
            entryFile: target.entryFile
        };
    }
}
function createSessionId(projectKind) {
    return `${projectKind}-${Date.now()}`;
}
