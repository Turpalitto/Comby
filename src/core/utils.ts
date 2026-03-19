import type { ProjectType } from './types';

export function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function projectTypeLabel(type: ProjectType): string {
  const labels: Record<ProjectType, string> = {
    website: 'Website',
    app:     'Web App',
    game:    'Browser Game',
  };
  return labels[type];
}
