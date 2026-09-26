import React from 'react';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { Brain, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Real API topic slugs → their bundled Lottie animation, in the Nightlight
 * and Daylight recolours (assets/lottie/night|day — see FEATURES_BRIEF §4;
 * the originals in assets/lottie/ are kept untouched). Only these 17 topics
 * have animations; anything else falls back to a plain icon. `.json` isn't
 * a Metro asset extension, so `require()` returns the parsed animation.
 */
const LOTTIE_NIGHT: Record<string, AnimationObject> = {
  abuse: require('@/assets/lottie/night/abuse.json'),
  dementia: require('@/assets/lottie/night/dementia.json'),
  'suicide-and-self-harm': require('@/assets/lottie/night/suicide-and-self-harm.json'),
  'personality-disorders': require('@/assets/lottie/night/personality-disorders.json'),
  'eating-disorders': require('@/assets/lottie/night/eating-disorders.json'),
  'behavioral-addiction-and-substance-abuse': require('@/assets/lottie/night/behavioral-addiction-and-substance-abuse.json'),
  autism: require('@/assets/lottie/night/autism.json'),
  bipolar: require('@/assets/lottie/night/bipolar.json'),
  anxiety: require('@/assets/lottie/night/anxiety.json'),
  depression: require('@/assets/lottie/night/depression.json'),
  'psychotic-disorders': require('@/assets/lottie/night/psychotic-disorders.json'),
  'attention-deficit-hyperactivity-adhd': require('@/assets/lottie/night/attention-deficit-hyperactivity-adhd.json'),
  'ai-dependence': require('@/assets/lottie/night/AI_dependence.json'),
  'childhood-development': require('@/assets/lottie/night/Childhood_Developmental.json'),
  'holistic-wellbeing': require('@/assets/lottie/night/Holistic_wellbeing.json'),
  'media-and-mental-health': require('@/assets/lottie/night/Media_and_Mental_Health.json'),
  'weight-management': require('@/assets/lottie/night/Weight_management.json'),
};

const LOTTIE_DAY: Record<string, AnimationObject> = {
  abuse: require('@/assets/lottie/day/abuse.json'),
  dementia: require('@/assets/lottie/day/dementia.json'),
  'suicide-and-self-harm': require('@/assets/lottie/day/suicide-and-self-harm.json'),
  'personality-disorders': require('@/assets/lottie/day/personality-disorders.json'),
  'eating-disorders': require('@/assets/lottie/day/eating-disorders.json'),
  'behavioral-addiction-and-substance-abuse': require('@/assets/lottie/day/behavioral-addiction-and-substance-abuse.json'),
  autism: require('@/assets/lottie/day/autism.json'),
  bipolar: require('@/assets/lottie/day/bipolar.json'),
  anxiety: require('@/assets/lottie/day/anxiety.json'),
  depression: require('@/assets/lottie/day/depression.json'),
  'psychotic-disorders': require('@/assets/lottie/day/psychotic-disorders.json'),
  'attention-deficit-hyperactivity-adhd': require('@/assets/lottie/day/attention-deficit-hyperactivity-adhd.json'),
  'ai-dependence': require('@/assets/lottie/day/AI_dependence.json'),
  'childhood-development': require('@/assets/lottie/day/Childhood_Developmental.json'),
  'holistic-wellbeing': require('@/assets/lottie/day/Holistic_wellbeing.json'),
  'media-and-mental-health': require('@/assets/lottie/day/Media_and_Mental_Health.json'),
  'weight-management': require('@/assets/lottie/day/Weight_management.json'),
};

export function hasLottieAnimation(slug: string): boolean {
  return slug in LOTTIE_NIGHT;
}

interface LottieTopicIconProps {
  slug: string;
  size: number;
  /** Used only for the fallback icon when the slug has no bundled animation. */
  fallbackIcon?: LucideIcon;
}

export default function LottieTopicIcon({ slug, size, fallbackIcon: FallbackIcon = Brain }: LottieTopicIconProps) {
  const { colors, isNight } = useTheme();
  const source = (isNight ? LOTTIE_NIGHT : LOTTIE_DAY)[slug];
  if (!source) {
    return <FallbackIcon size={size * 0.8} color={colors.primary} strokeWidth={1.6} />;
  }
  return (
    <LottieView
      // Remount on theme change so the new colours load from frame 0.
      key={isNight ? 'night' : 'day'}
      source={source}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}
