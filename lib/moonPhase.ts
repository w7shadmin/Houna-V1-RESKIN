/**
 * Tonight's moon, worked out from the date alone (the sum weather apps do): the
 * moon's phases repeat every synodic month, counted from a known new moon. Good
 * to within a few hours, offline, with no permissions.
 */

/** A known new moon: 6 January 2000, 18:14 UTC. */
const EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14);
/** The mean synodic month, new moon to new moon, in days. */
export const SYNODIC_DAYS = 29.530588853;
const DAY_MS = 86_400_000;

export type MoonPhaseName =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

const NAMES: MoonPhaseName[] = [
  'new',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'full',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
];

export interface MoonPhase {
  /** Days since the last new moon, 0 to SYNODIC_DAYS. */
  age: number;
  /** The share of the disc that's lit, 0 (new) to 1 (full). */
  fraction: number;
  /** Growing towards full. Seen from the Gulf (northern hemisphere) its lit side is on the right while waxing, the left while waning. */
  waxing: boolean;
  /** Less than half lit. */
  crescent: boolean;
  /**
   * The terminator's half-width as a share of the radius: the lit shape is the
   * lit half-disc less (crescent) or plus (gibbous) an ellipse this wide.
   * 0 at the quarters, 1 at new and full moon.
   */
  terminator: number;
  name: MoonPhaseName;
}

export function moonPhase(date: Date): MoonPhase {
  const days = (date.getTime() - EPOCH_MS) / DAY_MS;
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const cos = Math.cos((2 * Math.PI * age) / SYNODIC_DAYS);
  const eighth = SYNODIC_DAYS / 8;
  return {
    age,
    fraction: (1 - cos) / 2,
    waxing: age < SYNODIC_DAYS / 2,
    crescent: cos > 0,
    terminator: Math.abs(cos),
    // Each name spans an eighth of the cycle, centred on its moment (new moon at 0).
    name: NAMES[Math.floor(((age + eighth / 2) % SYNODIC_DAYS) / eighth)],
  };
}

/** How far the lit part swells on the in-breath, as a share of the radius. */
const SWELL = 0.15;

/**
 * The terminator's width at the out-breath and the in-breath: the lit part
 * swells a little on the in-breath (the ellipse narrows on a crescent, widens
 * on a gibbous) and never crosses the quarter line, so the moon's shape stays
 * tonight's. A full moon can't grow; only its halo breathes.
 */
export function terminatorBreath(phase: MoonPhase): [number, number] {
  const t = phase.terminator;
  return [t, phase.crescent ? Math.max(0, t - SWELL) : Math.min(1, t + SWELL)];
}
