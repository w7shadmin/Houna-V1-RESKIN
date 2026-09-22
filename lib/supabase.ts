import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — set them in .env (see .env.example).',
  );
}

/**
 * The houna-proxy edge function (see lib/hounaApi.ts) is called directly via
 * fetch, not through this client's query builder — this instance is for
 * Auth (Alias accounts), Postgres (profiles), and Storage (avatars).
 *
 * `detectSessionInUrl` is web-only: on native there's no browser URL to
 * inspect, and leaving it on there throws. AsyncStorage as the auth token
 * store is what makes sign-in survive an app restart.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
