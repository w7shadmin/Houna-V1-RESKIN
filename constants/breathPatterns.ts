import type { IconTileTone } from '@/components/ui/IconTile';

/**
 * The Breathe carousel's exercises, in order, with their canvas tone and
 * timings. Every exercise runs in place on the Tanafas hub
 * (`components/tanafas/BreathePlayers.tsx`); the players read their timings
 * from here, never hardcode them.
 */

export type BreatheKey = 'anxiety-relief' | 'steady-mind' | 'panic-relief' | 'tension-release';

export const BREATHE_ORDER: readonly BreatheKey[] = ['anxiety-relief', 'steady-mind', 'panic-relief', 'tension-release'];

export const BREATHE_TONE: Record<BreatheKey, IconTileTone> = {
  'anxiety-relief': 'glow',
  'steady-mind': 'dusk',
  'panic-relief': 'dawn',
  'tension-release': 'glow',
};

export interface BreathPhase {
  key: 'inhale' | 'hold' | 'exhale';
  seconds: number;
  /** How full the orb is by the end of the phase: 0 at rest, 1 filling the ring. */
  fill: 0 | 1;
}

/** Timed breathing patterns: one round is the phases in order. */
export const BREATH_PATTERNS: Record<'anxiety-relief' | 'steady-mind', readonly BreathPhase[]> = {
  // 4-7-8
  'anxiety-relief': [
    { key: 'inhale', seconds: 4, fill: 1 },
    { key: 'hold', seconds: 7, fill: 1 },
    { key: 'exhale', seconds: 8, fill: 0 },
  ],
  // Box / 4x4
  'steady-mind': [
    { key: 'inhale', seconds: 4, fill: 1 },
    { key: 'hold', seconds: 4, fill: 1 },
    { key: 'exhale', seconds: 4, fill: 0 },
    { key: 'hold', seconds: 4, fill: 0 },
  ],
};

export const SESSION_MINUTES = [1, 3, 5] as const;
export const DEFAULT_SESSION_MINUTES = 3;

/** Progressive muscle relaxation: each group is tensed, then released. */
export const TENSE_MS = 5000;
export const RELEASE_MS = 7000;
