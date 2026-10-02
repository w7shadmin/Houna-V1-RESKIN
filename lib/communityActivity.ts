import { supabase } from './supabase';
import type { CountryCount } from '@/components/community/WorldMap';

export type ActivityPeriod = '24h' | 'week' | 'month';

/** Same order as `home.community.periods` in the string catalogue. */
export const ACTIVITY_PERIODS: ActivityPeriod[] = ['24h', 'week', 'month'];

export interface CommunityActivity {
  totalSessions: number;
  totalPeople: number;
  countries: CountryCount[];
}

/**
 * Aggregate breathing/meditation activity for Home's community card, via
 * the `get_community_activity` SECURITY DEFINER RPC (FEATURES_BRIEF §1) —
 * aggregates only, never user ids. Returns null when the RPC isn't
 * available or fails, so the card can show its quiet fallback instead of a
 * made-up number.
 */
export async function fetchCommunityActivity(period: ActivityPeriod): Promise<CommunityActivity | null> {
  try {
    const { data, error } = await supabase.rpc('get_community_activity', { period });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      totalSessions: Number(row.total_sessions) || 0,
      totalPeople: Number(row.total_people) || 0,
      countries: Array.isArray(row.countries)
        ? row.countries
            .filter((c: { country?: unknown }) => typeof c?.country === 'string')
            .map((c: { country: string; count: unknown }) => ({ country: c.country, count: Number(c.count) || 0 }))
        : [],
    };
  } catch {
    return null;
  }
}
