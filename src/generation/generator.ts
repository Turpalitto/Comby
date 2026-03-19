import type {
  FilePlan,
  ProjectSpec,
  GeneratedFile,
  IFileGenerator,
} from '@/core/types';
import { buildWebsiteHTML } from '@/templates/website';
import { buildAppHTML }     from '@/templates/app';
import { buildGameHTML }    from '@/templates/game';

export class FileGenerator implements IFileGenerator {
  generate(plan: FilePlan, spec: ProjectSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    for (const planned of plan.files) {
      const content = this.renderFile(planned.templateKey ?? '', spec);
      if (content !== null) {
        files.push({ path: planned.path, content });
      }
    }

    return files;
  }

  private renderFile(templateKey: string, spec: ProjectSpec): string | null {
    switch (templateKey) {
      case 'website/index':
        return spec.type === 'website' ? buildWebsiteHTML(spec) : null;
      case 'app/index':
        return spec.type === 'app'     ? buildAppHTML(spec)     : null;
      case 'game/index':
        return spec.type === 'game'    ? buildGameHTML(spec)    : null;
      default:
        return null;
    }
  }
}
