import { supabase } from './supabase';
import { localDateString, type MoodTag } from './journal';

/**
 * Anonymous "you're not alone" signal (Segment 3 of the accounts roadmap).
 * `mood_pings` carries no user id and no auth is required to write it — it
 * works identically for Guest and Alias, unlike everything else in this
 * roadmap, since it holds nothing more identifying than a mood tag and a
 * date. Records a ping for today's mood, then returns how many pings
 * (including this one) share the same mood and date.
 *
 * Fire-and-forget in spirit: any failure (network, RLS, whatever) just means
 * the caller quietly skips the nudge — never worth surfacing as an error
 * over a private mood check-in.
 */
export async function pingMoodAndGetCount(mood: MoodTag): Promise<number | null> {
  try {
    const today = localDateString(new Date());
    await supabase.from('mood_pings').insert({ mood_tag: mood, ping_date: today });

    const { data, error } = await supabase.rpc('get_mood_ping_count', {
      p_mood_tag: mood,
      p_date: today,
    });
    if (error || typeof data !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}
