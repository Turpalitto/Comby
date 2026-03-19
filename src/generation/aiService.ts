/**
 * AI Generation Service
 *
 * Hybrid mode:
 *   - spec    → normaliseIdeaToSpec (template, fast)
 *   - filePlan → FilePlanBuilder (template, with AI context fields)
 *   - files   → Claude API for website / template fallback for app & game
 */

import type {
  UserIdea,
  ProjectType,
  ProjectSpec,
  FilePlan,
  GeneratedFile,
  WebsiteSpec,
} from '@/core/types';
import type { IGenerationService } from './service';
import { templateService }          from './service';
import { FilePlanBuilder }           from './filePlan';

const planBuilder = new FilePlanBuilder();

export class AIGenerationService implements IGenerationService {
  readonly mode = 'hybrid' as const;

  // Spec stays template-based — fast and accurate
  async generateSpecFromIdea(idea: UserIdea, type: ProjectType): Promise<ProjectSpec> {
    return templateService.generateSpecFromIdea(idea, type);
  }

  // File plan stays template-based, but we inject AI context fields
  async buildFilePlan(spec: ProjectSpec): Promise<FilePlan> {
    const plan = planBuilder.build(spec);

    // Annotate each planned file with an AI prompt for Stage 9
    const annotatedFiles = plan.files.map(f => ({
      ...f,
      aiPrompt: f.templateKey === 'website/index' && spec.type === 'website'
        ? `Generate the complete HTML for a ${spec.tone} ${spec.type} called "${spec.title}" with sections: ${(spec as WebsiteSpec).sections.join(', ')}`
        : undefined,
    }));

    return {
      ...plan,
      files:           annotatedFiles,
      generationMode:  'hybrid',
      projectContext:  buildProjectContext(spec),
    };
  }

  // Files: Claude for website, template fallback for app/game
  async generateFilesFromPlan(plan: FilePlan, spec: ProjectSpec): Promise<GeneratedFile[]> {
    if (spec.type !== 'website') {
      // app and game stay template-based in this stage
      return templateService.generateFilesFromPlan(plan, spec);
    }

    return generateWebsiteWithAI(spec as WebsiteSpec);
  }
}

// ─── AI call ─────────────────────────────────────────────────

async function generateWebsiteWithAI(spec: WebsiteSpec): Promise<GeneratedFile[]> {
  const response = await fetch('/api/generate/website', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ spec }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error ?? `API error ${response.status}`);
  }

  // Read streaming response
  const html = await readStream(response);

  // Strip markdown code fences if model wrapped the HTML
  let trimmed = html.trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/,'').trim();
  }

  if (!trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html')) {
    throw new Error('AI returned invalid HTML. Check the API key and try again.');
  }

  return [{ path: 'index.html', content: trimmed }];
}

async function readStream(response: Response): Promise<string> {
  const reader  = response.body?.getReader();
  const decoder = new TextDecoder();
  let result    = '';

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode(); // flush
  return result;
}

// ─── Context builder — used for AI prompts ────────────────────

export function buildProjectContext(spec: ProjectSpec): string {
  const lines = [
    `Project: "${spec.title}"`,
    `Type: ${spec.type}`,
    `Description: ${spec.description}`,
    `Primary color: ${spec.primaryColor}`,
    spec.features.length > 0 ? `Features: ${spec.features.join(', ')}` : null,
  ].filter(Boolean) as string[];

  const extra =
    spec.type === 'website'
      ? [`Sections: ${spec.sections.join(', ')}`, `Tone: ${spec.tone}`]
      : spec.type === 'app'
      ? [`Layout: ${spec.layout}`, `Views: ${spec.views.join(', ')}`, `Widgets: ${spec.widgets.join(', ')}`]
      : [`Genre: ${spec.genre}`, `Difficulty: ${spec.difficulty}`, `Mechanics: ${spec.mechanics.join(', ')}`];

  return [...lines, ...extra].join('\n');
}

// ─── Singleton ────────────────────────────────────────────────
export const aiService = new AIGenerationService();
