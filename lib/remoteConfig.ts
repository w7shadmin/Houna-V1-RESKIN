import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Settings the app reads at launch from `app_config` (a public table: nothing secret), so they can
 * change without a new build. Until the Houna Console manages them, change one with an UPDATE in
 * the SQL editor.
 *
 * - `minVersion`: this platform's oldest version still allowed ("0.0.0" = none), and `updateUrl`,
 *   where to update (the store page, once there is one).
 * - `turnstileSiteKey`: Cloudflare Turnstile's public site key; bot protection on sign-in and
 *   sign-up is on only while it's set (its secret lives in Supabase Auth).
 *
 * Loaded once per launch. If the network fails, the last copy saved on the phone is used, else the
 * bundled defaults: nothing is ever blocked because the settings couldn't be read.
 */
export interface RemoteConfig {
  minVersion: string;
  updateUrl: string | null;
  turnstileSiteKey: string | null;
}

export const BUNDLED_CONFIG: RemoteConfig = { minVersion: '0.0.0', updateUrl: null, turnstileSiteKey: null };

const CACHE_KEY = 'houna-remote-config';

type Rows = { key: string; value: Record<string, unknown> }[];

function fromRows(rows: Rows): RemoteConfig {
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value ?? {}]));
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null;
  const min = byKey.min_version ?? {};
  const version = platform ? min[platform] : null;
  const url = platform ? min[`${platform}_url`] : null;
  const siteKey = byKey.turnstile?.site_key;
  return {
    minVersion: typeof version === 'string' && /^\d+(\.\d+)*$/.test(version) ? version : BUNDLED_CONFIG.minVersion,
    updateUrl: typeof url === 'string' && /^https:\/\//.test(url) ? url : null,
    turnstileSiteKey: typeof siteKey === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(siteKey) ? siteKey : null,
  };
}

let loading: Promise<RemoteConfig> | null = null;

export function loadRemoteConfig(): Promise<RemoteConfig> {
  if (!loading) {
    loading = (async () => {
      try {
        const { data, error } = await supabase.from('app_config').select('key, value');
        if (error || !data) throw error ?? new Error('no config');
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
        return fromRows(data as Rows);
      } catch {
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) return fromRows(JSON.parse(cached) as Rows);
        } catch {
          // fall through to the defaults
        }
        return BUNDLED_CONFIG;
      }
    })();
  }
  return loading;
}
