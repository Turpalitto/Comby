// Game mode — keyword detector (stub for Stage 5)
export const GAME_KEYWORDS = [
  'game', 'play', 'player', 'shoot', 'jump', 'platform', 'puzzle',
  'arcade', 'runner', 'enemy', 'score', 'level', 'boss', 'pixel',
];

export function scoreGame(idea: string): number {
  const lower = idea.toLowerCase();
  return GAME_KEYWORDS.filter(kw => lower.includes(kw)).length;
}
