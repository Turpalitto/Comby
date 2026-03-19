import { appMode } from "../modes/app/AppMode";
import { gameMode } from "../modes/game/GameMode";
import { websiteMode } from "../modes/website/WebsiteMode";
const registry = {
    website: websiteMode,
    app: appMode,
    game: gameMode
};
export function listModes() {
    return Object.values(registry);
}
export function getMode(kind) {
    return registry[kind];
}
