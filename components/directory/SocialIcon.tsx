import React from 'react';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Globe } from 'lucide-react-native';
import type { SocialPlatform } from '@/lib/socialPlatform';

/** Font Awesome 6 Brands glyphs (bundled with @expo/vector-icons). */
const GLYPH: Record<Exclude<SocialPlatform, 'web'>, string> = {
  instagram: 'instagram',
  tiktok: 'tiktok',
  snapchat: 'snapchat',
  whatsapp: 'whatsapp',
  x: 'x-twitter',
  facebook: 'facebook-f',
  youtube: 'youtube',
  linkedin: 'linkedin-in',
  telegram: 'telegram',
  threads: 'threads',
  pinterest: 'pinterest-p',
};

/** The platform's brand mark, drawn in one colour to sit with the app's icons. */
export default function SocialIcon({ platform, size = 20, color }: { platform: SocialPlatform; size?: number; color: string }) {
  if (platform === 'web') return <Globe size={size} color={color} strokeWidth={1.7} />;
  return <FontAwesome6 name={GLYPH[platform]} brand size={size} color={color} />;
}
