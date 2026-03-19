import type {
  ProjectSpec,
  FilePlan,
  PlannedFile,
  IFilePlanBuilder,
  WebsiteSpec,
  AppSpec,
  GameSpec,
} from '@/core/types';

export class FilePlanBuilder implements IFilePlanBuilder {
  build(spec: ProjectSpec): FilePlan {
    switch (spec.type) {
      case 'website': return buildWebsitePlan(spec);
      case 'app':     return buildAppPlan(spec);
      case 'game':    return buildGamePlan(spec);
    }
  }
}

// ─── Website plan ─────────────────────────────────────────────

function buildWebsitePlan(spec: WebsiteSpec): FilePlan {
  const files: PlannedFile[] = [
    {
      path:        'index.html',
      type:        'markup',
      description: `Main page — ${spec.sections.join(', ')} sections`,
      templateKey: 'website/index',
    },
  ];

  return { files, entryPoint: 'index.html' };
}

// ─── App plan ─────────────────────────────────────────────────

function buildAppPlan(spec: AppSpec): FilePlan {
  const files: PlannedFile[] = [
    {
      path:        'index.html',
      type:        'markup',
      description: `Dashboard shell — ${spec.layout} layout, views: ${spec.views.join(', ')}`,
      templateKey: 'app/index',
    },
  ];

  return { files, entryPoint: 'index.html' };
}

// ─── Game plan ────────────────────────────────────────────────

function buildGamePlan(spec: GameSpec): FilePlan {
  const files: PlannedFile[] = [
    {
      path:        'index.html',
      type:        'markup',
      description: `${spec.genre} game — ${spec.difficulty} difficulty, mechanics: ${spec.mechanics.join(', ')}`,
      templateKey: 'game/index',
    },
  ];

  return { files, entryPoint: 'index.html' };
}
