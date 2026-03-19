export class CreateFilePlanStep {
    execute(spec) {
        return {
            rootDir: slugify(spec.name),
            files: fileTemplates[spec.kind]
        };
    }
}
const fileTemplates = {
    website: [
        { path: "index.html", purpose: "HTML entry point" },
        { path: "src/main.ts", purpose: "Website bootstrap" },
        { path: "src/styles.css", purpose: "Website styles" }
    ],
    app: [
        { path: "index.html", purpose: "HTML entry point" },
        { path: "src/main.tsx", purpose: "App bootstrap" },
        { path: "src/App.tsx", purpose: "Root application shell" },
        { path: "src/components/", purpose: "Reusable UI components" }
    ],
    game: [
        { path: "index.html", purpose: "HTML entry point" },
        { path: "src/main.ts", purpose: "Game bootstrap" },
        { path: "src/game/Game.ts", purpose: "Main game loop" },
        { path: "src/game/scenes/", purpose: "Scene modules" }
    ]
};
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
