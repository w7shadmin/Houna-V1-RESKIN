import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** The time, refreshed whenever the screen comes into focus and every `everyMs` while it stays. */
export function useNow(everyMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      const id = setInterval(() => setNow(new Date()), everyMs);
      return () => clearInterval(id);
    }, [everyMs]),
  );
  return now;
}
