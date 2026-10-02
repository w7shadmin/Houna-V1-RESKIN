import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { liveState, parseLiveEvent, type LiveEvent, type LiveState } from '@/lib/liveEvent';

/** Read again on focus at most this often: a live event is set shortly before it starts. */
const REFRESH_MS = 2 * 60 * 1000;

let cached: LiveEvent | null = null;
let fetchedAt = 0;
let inFlight: Promise<LiveEvent | null> | null = null;

/** The `live_event` setting (one small read of `app_config`), shared by every screen that shows it. */
function loadLiveEvent(force = false): Promise<LiveEvent | null> {
  if (!force && Date.now() - fetchedAt < REFRESH_MS) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const { data, error } = await supabase.from('app_config').select('value').eq('key', 'live_event').maybeSingle();
        if (!error) {
          cached = parseLiveEvent(data?.value);
          fetchedAt = Date.now();
        }
      } catch {
        // Keep the last copy: a failed read never hides a banner already shown, nor shows one.
      } finally {
        inFlight = null;
      }
      return cached;
    })();
  }
  return inFlight;
}

/**
 * The live event to show and where it stands ('soon' or 'live'), or nulls. Re-read when the screen
 * comes into focus, and re-checked every 30 s so the banner turns to "Live now" at the start and
 * goes at the end without a reload.
 */
export function useLiveEvent(): { event: LiveEvent | null; state: LiveState | null } {
  const [event, setEvent] = useState<LiveEvent | null>(cached);
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadLiveEvent().then((e) => alive && setEvent(e));
      return () => {
        alive = false;
      };
    }, []),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const state = liveState(event, now);
  return { event: state ? event : null, state };
}
