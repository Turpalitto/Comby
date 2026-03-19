import type { GameSpec } from '@/core/types';
import { DEFAULT_PRIMARY_COLOR } from '@/core/constants';

export function buildGameSpec(partial: Partial<GameSpec>): GameSpec {
  return {
    type:         'game',
    title:        partial.title        ?? 'My Game',
    description:  partial.description  ?? '',
    primaryColor: partial.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    features:     partial.features     ?? [],
    genre:        partial.genre        ?? 'arcade',
    player:       partial.player       ?? { movement: 'keyboard', sprite: 'square' },
    mechanics:    partial.mechanics    ?? ['move', 'score'],
    difficulty:   partial.difficulty   ?? 'medium',
  };
}
