import React from 'react';
import { MOOD_STYLE } from '@/constants/moods';
import { currentMood, type MoodTag } from '@/lib/journal';
import MoodBloom, { MOOD_BLOOMS } from './MoodBloom';

/**
 * A small, still bloom for a mood — the journal's stand-in for an emoji, so
 * a mood looks the same as on the check-in slider. Retired moods keep their
 * own colour and take the shape of the mood they now sit with.
 */
export default function MoodGlyph({ mood, size = 28 }: { mood: MoodTag; size?: number }) {
  const shape = MOOD_BLOOMS[currentMood(mood)];
  const style = MOOD_STYLE[mood];
  return <MoodBloom size={size} color={style.color} hi={style.hi} shape={shape} ringOpacity={shape.ringOpacity} />;
}
