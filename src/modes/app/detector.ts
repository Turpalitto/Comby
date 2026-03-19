// App mode — keyword detector (stub for Stage 5)
export const APP_KEYWORDS = [
  'app', 'dashboard', 'admin', 'panel', 'tool', 'tracker',
  'manager', 'crm', 'kanban', 'analytics', 'todo', 'monitor',
];

export function scoreApp(idea: string): number {
  const lower = idea.toLowerCase();
  return APP_KEYWORDS.filter(kw => lower.includes(kw)).length;
}
