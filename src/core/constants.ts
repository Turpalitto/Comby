import type { ProjectType, BuildStatus } from './types';

export const PROJECT_TYPES: ProjectType[] = ['website', 'app', 'game'];

export const BUILD_STATUS_LABELS: Record<BuildStatus, string> = {
  idle:       'Waiting for idea...',
  detecting:  'Detecting project type...',
  speccing:   'Building spec...',
  planning:   'Planning files...',
  generating: 'Generating project...',
  ready:      'Ready',
  error:      'Error',
};

export const BUILD_STATUS_PROGRESS: Record<BuildStatus, number> = {
  idle:       0,
  detecting:  15,
  speccing:   35,
  planning:   55,
  generating: 80,
  ready:      100,
  error:      0,
};

export const DEFAULT_PRIMARY_COLOR = '#6366f1'; // indigo-500
