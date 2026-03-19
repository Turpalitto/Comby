import type { WebsiteSpec } from '@/core/types';
import { DEFAULT_PRIMARY_COLOR } from '@/core/constants';

export function buildWebsiteSpec(partial: Partial<WebsiteSpec>): WebsiteSpec {
  return {
    type:         'website',
    title:        partial.title        ?? 'My Website',
    description:  partial.description  ?? '',
    primaryColor: partial.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    features:     partial.features     ?? [],
    sections:     partial.sections     ?? ['hero', 'features', 'cta', 'footer'],
    tone:         partial.tone         ?? 'professional',
  };
}
