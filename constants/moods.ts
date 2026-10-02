/**
 * Mood colours — the one table the slider's bloom, the journal (calendar,
 * legend, trend chart) and the recap orbs all read, so a mood looks the same
 * everywhere, in Night and Day.
 *
 * Seven moods on one pleasantness scale (the shape of Apple Health's
 * 7-point State of Mind scale), coloured by the Yale Mood Meter's quadrants:
 * red for high-energy unpleasant (angry, anxious), blue for low-energy
 * unpleasant (sad), green for low-energy pleasant (calm, hopeful), yellow
 * for high-energy pleasant (joyful), with neutral a warm sand between.
 */

export interface MoodStyle {
  /** Ring, leaf base, dot and chart colour. */
  color: string;
  /** Highlight: leaf gradient start, bloom head, orb highlight. */
  hi: string;
  /** Shadow side of a recap orb. */
  lo: string;
  /** Halo, alpha included. */
  glow: string;
}

export const MOOD_STYLE = {
  angry: { color: '#E36F5E', hi: '#FFE1DA', lo: '#A23A2C', glow: 'rgba(227,111,94,0.42)' },
  anxious: { color: '#F0B27A', hi: '#FFEEDC', lo: '#B9713A', glow: 'rgba(240,178,122,0.42)' },
  sad: { color: '#82A4EE', hi: '#E2EBFF', lo: '#3D5DB0', glow: 'rgba(130,164,238,0.42)' },
  neutral: { color: '#D2CBB9', hi: '#FFFFFF', lo: '#8A8474', glow: 'rgba(210,203,185,0.34)' },
  calm: { color: '#62D2C9', hi: '#E4FBF7', lo: '#1F7A74', glow: 'rgba(98,210,201,0.48)' },
  hopeful: { color: '#9BD67E', hi: '#EEF9E4', lo: '#4E8A3A', glow: 'rgba(155,214,126,0.44)' },
  joyful: { color: '#F2C76B', hi: '#FFF3D6', lo: '#B08526', glow: 'rgba(242,199,107,0.46)' },
  // Retired from the slider; kept so older entries still show their own colour.
  frustrated: { color: '#EA90A8', hi: '#FFE3EB', lo: '#B24B6B', glow: 'rgba(234,144,168,0.42)' },
  tired: { color: '#AE9FF2', hi: '#EEEAFF', lo: '#6A5CC4', glow: 'rgba(174,159,242,0.42)' },
} as const satisfies Record<string, MoodStyle>;
