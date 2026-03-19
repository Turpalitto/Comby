// Website mode — keyword detector (stub for Stage 5)
export const WEBSITE_KEYWORDS = [
  'landing', 'homepage', 'portfolio', 'blog', 'site', 'website',
  'showcase', 'agency', 'saas', 'startup', 'product page', 'personal site',
];

export function scoreWebsite(idea: string): number {
  const lower = idea.toLowerCase();
  return WEBSITE_KEYWORDS.filter(kw => lower.includes(kw)).length;
}
