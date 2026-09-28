import type { IconTileTone } from '@/components/ui/IconTile';

/**
 * The Breathe carousel's exercises, in order, with their canvas tone and
 * timings. Every exercise runs in place on the Tanafas hub
 * (`components/tanafas/BreathePlayers.tsx`); the players read their timings
 * from here, never hardcode them.
 */

export type BreatheKey = 'anxiety-relief' | 'steady-mind' | 'panic-relief' | 'tension-release' | 'physiological-sigh';

export const BREATHE_ORDER: readonly BreatheKey[] = ['anxiety-relief', 'physiological-sigh', 'steady-mind', 'panic-relief', 'tension-release'];

export const BREATHE_TONE: Record<BreatheKey, IconTileTone> = {
  'anxiety-relief': 'glow',
  'steady-mind': 'dusk',
  'panic-relief': 'dawn',
  // Its own colour: it sits between grounding (dawn) and, wrapping round, 4-7-8 (glow).
  'tension-release': 'bloom',
  // A fifth tone: between relaxation (bloom) and, wrapping round, 4-7-8 (glow).
  'physiological-sigh': 'tide',
};

export interface BreathPhase {
  /** `topup`: the physiological sigh's second, short breath in, on top of the first. */
  key: 'inhale' | 'topup' | 'hold' | 'exhale';
  seconds: number;
  /** How full the orb is by the end of the phase: 0 at rest, 1 filling the ring (the sigh's first breath stops short). */
  fill: number;
}

/** Timed breathing patterns: one round is the phases in order. */
export const BREATH_PATTERNS: Record<'anxiety-relief' | 'steady-mind' | 'physiological-sigh', readonly BreathPhase[]> = {
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
  // The physiological sigh: in through the nose, a short top-up, one long breath out. No hold.
  'physiological-sigh': [
    { key: 'inhale', seconds: 2, fill: 0.8 },
    { key: 'topup', seconds: 1, fill: 1 },
    { key: 'exhale', seconds: 6, fill: 0 },
  ],
};

/**
 * The first breath (`app/welcome.tsx`), shown once before anything is asked: one breath, in 4,
 * a gentle 2 at the top, out 6. Not an exercise: nothing is counted.
 */
export const FIRST_BREATH: readonly BreathPhase[] = [
  { key: 'inhale', seconds: 4, fill: 1 },
  { key: 'hold', seconds: 2, fill: 1 },
  { key: 'exhale', seconds: 6, fill: 0 },
];

/** Seconds of 3 · 2 · 1 before any breathing exercise starts (components/tanafas/Countdown.tsx). */
export const COUNTDOWN_SECONDS = 3;

export const SESSION_MINUTES = [1, 3, 5] as const;
export const DEFAULT_SESSION_MINUTES = 3;

/**
 * Panic relief grounding: the orb opens full as it begins, then gives this much
 * (of its 0–1 fill) at each step, so the five steps end at 0.4.
 */
export const GROUNDING_STEP_DEFLATE = 0.15;

/** Progressive muscle relaxation: each group is tensed, then released. */
export const TENSE_MS = 5000;
export const RELEASE_MS = 7000;

/** Meditation lengths offered on the hub; null is "no limit". */
export const MEDITATION_MINUTES: readonly (number | null)[] = [3, 5, 10, 15, 20, 30, 45, 60, null];
/** A custom length, set on the wheel's last row: from 1 minute to 2 hours. */
export const MEDITATION_CUSTOM_RANGE = [1, 120] as const;
export const DEFAULT_MEDITATION_MINUTES = 10;
