import type { GeneratedProject, PreviewConfig, PreviewMode } from '@/core/types';

export class PreviewManager {
  private activeUrl: string | null = null;

  getConfig(project: GeneratedProject): PreviewConfig {
    const mode: PreviewMode = 'iframe'; // all modes use iframe (game is HTML canvas)
    return {
      mode,
      entryFile: project.filePlan.entryPoint,
      projectId: project.id,
    };
  }

  /** Build a blob URL from the project's entry file. Revokes the previous one. */
  buildPreviewUrl(project: GeneratedProject): string {
    this.revoke();

    const entry = project.files.find(f => f.path === project.filePlan.entryPoint);
    if (!entry) return '';

    const blob = new Blob([entry.content], { type: 'text/html' });
    this.activeUrl = URL.createObjectURL(blob);
    return this.activeUrl;
  }

  /** Build a blob URL directly from an HTML string. */
  buildFromHtml(html: string): string {
    this.revoke();
    const blob = new Blob([html], { type: 'text/html' });
    this.activeUrl = URL.createObjectURL(blob);
    return this.activeUrl;
  }

  /** Release the current blob URL to avoid memory leaks. */
  revoke(): void {
    if (this.activeUrl) {
      URL.revokeObjectURL(this.activeUrl);
      this.activeUrl = null;
    }
  }
}

// Singleton for the shell — one manager per session
export const previewManager = new PreviewManager();
