import React from 'react';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { Brain, type LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';

/**
 * Real API topic slugs → their bundled Lottie animation. Ported from the
 * fuller in-progress build the user shared (assets/animations/*.json) —
 * only these 17 topics have real animations; anything else the API returns
 * falls back to a plain icon. `.json` isn't a Metro asset extension, so
 * `require()` here returns the parsed animation object directly, not an
 * asset reference number.
 */
const LOTTIE_MAP: Record<string, AnimationObject> = {
  abuse: require('@/assets/lottie/abuse.json'),
  dementia: require('@/assets/lottie/dementia.json'),
  'suicide-and-self-harm': require('@/assets/lottie/suicide-and-self-harm.json'),
  'personality-disorders': require('@/assets/lottie/personality-disorders.json'),
  'eating-disorders': require('@/assets/lottie/eating-disorders.json'),
  'behavioral-addiction-and-substance-abuse': require('@/assets/lottie/behavioral-addiction-and-substance-abuse.json'),
  autism: require('@/assets/lottie/autism.json'),
  bipolar: require('@/assets/lottie/bipolar.json'),
  anxiety: require('@/assets/lottie/anxiety.json'),
  depression: require('@/assets/lottie/depression.json'),
  'psychotic-disorders': require('@/assets/lottie/psychotic-disorders.json'),
  'attention-deficit-hyperactivity-adhd': require('@/assets/lottie/attention-deficit-hyperactivity-adhd.json'),
  'ai-dependence': require('@/assets/lottie/AI_dependence.json'),
  'childhood-development': require('@/assets/lottie/Childhood_Developmental.json'),
  'holistic-wellbeing': require('@/assets/lottie/Holistic_wellbeing.json'),
  'media-and-mental-health': require('@/assets/lottie/Media_and_Mental_Health.json'),
  'weight-management': require('@/assets/lottie/Weight_management.json'),
};

export function hasLottieAnimation(slug: string): boolean {
  return slug in LOTTIE_MAP;
}

interface LottieTopicIconProps {
  slug: string;
  size: number;
  /** Used only for the fallback icon when the slug has no bundled animation. */
  fallbackIcon?: LucideIcon;
}

export default function LottieTopicIcon({ slug, size, fallbackIcon: FallbackIcon = Brain }: LottieTopicIconProps) {
  const source = LOTTIE_MAP[slug];
  if (!source) {
    return <FallbackIcon size={size * 0.8} color={colors.primary} strokeWidth={1.6} />;
  }
  return (
    <LottieView
      source={source}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}
