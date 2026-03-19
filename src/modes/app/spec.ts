import type { AppSpec } from '@/core/types';
import { DEFAULT_PRIMARY_COLOR } from '@/core/constants';

export function buildAppSpec(partial: Partial<AppSpec>): AppSpec {
  return {
    type:         'app',
    title:        partial.title        ?? 'My App',
    description:  partial.description  ?? '',
    primaryColor: partial.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    features:     partial.features     ?? [],
    layout:       partial.layout       ?? 'sidebar',
    views:        partial.views        ?? ['Dashboard', 'Settings'],
    widgets:      partial.widgets      ?? ['cards'],
  };
}
