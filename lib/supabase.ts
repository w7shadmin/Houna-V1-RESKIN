import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — set them in .env (see .env.example).',
  );
}

/**
 * The houna-proxy edge function (see lib/hounaApi.ts) is called directly via
 * fetch, not through this client's query builder — this instance exists for
 * anything that needs Supabase auth/storage/realtime later.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
