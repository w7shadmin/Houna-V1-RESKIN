import { alpha, type ColorTokens } from '@/constants/theme';
import type { PracticeGroup } from '@/lib/practice';

/** Each part of practice's colour: the four exercises in their tones, meditation in ink, Home's sky visits in half-ink. */
export function practiceColours(colors: ColorTokens): Record<PracticeGroup, string> {
  return {
    anxietyRelief: colors.tones.glow.fg,
    steadyMind: colors.tones.dusk.fg,
    panicRelief: colors.tones.dawn.fg,
    tensionRelease: colors.tones.bloom.fg,
    meditation: colors.text,
    tanafas: alpha(colors.text, 0.5),
  };
}
