import Fastify from "fastify";
import type { BuilderIdeaInput } from "@combi/shared";
import { BuilderSessionService } from "./modules/builder-shell/BuilderSessionService";
import { listModes } from "./modules/shared/modeRegistry";

export function createApp() {
  const app = Fastify({ logger: true });
  const builderSessionService = new BuilderSessionService();

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/modes", async () => ({
    modes: listModes()
  }));

  app.post<{ Body: BuilderIdeaInput }>("/api/builder/draft", async (request) => {
    return builderSessionService.createDraft(request.body);
  });

  return app;
}

