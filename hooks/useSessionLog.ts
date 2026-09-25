import { useCallback, useEffect, useRef } from 'react';
import { logSession, type SessionKind } from '@/lib/sessionLog';
import { pingActivity } from '@/lib/usageTracking';

/**
 * Session bookkeeping for exercises that don't use the shared
 * `PhaseBreathingSession` shell. `start()` marks the beginning (and sends
 * the anonymous community ping); `end()` writes the on-device log exactly
 * once, whichever way the session ends — completion, restart or leaving
 * the screen (unmount ends it too). Never writes streak data.
 */
export function useSessionLog(kind: SessionKind, exercise: string) {
  const startedAt = useRef<Date | null>(null);

  const end = useCallback(() => {
    if (!startedAt.current) return;
    logSession(kind, exercise, startedAt.current).catch(() => {});
    startedAt.current = null;
  }, [kind, exercise]);

  const start = useCallback(() => {
    end();
    startedAt.current = new Date();
    pingActivity(kind).catch(() => {});
  }, [end, kind]);

  useEffect(() => end, [end]);

  return { start, end };
}
