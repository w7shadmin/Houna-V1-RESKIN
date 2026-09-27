import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { sessionsBetween, type LoggedSession } from '@/lib/sessionLog';
import { minutesByDayAndGroup, monthBounds, practiceByDay, dayKey, type DayPractice, type PracticeGroup } from '@/lib/practice';

export interface MonthPractice {
  /** The month's first day, and how many days it has. */
  from: Date;
  days: number;
  /** Today, 0-based within the month. */
  today: number;
  sessions: LoggedSession[];
  /** Minutes in each part, day by day (Your month in breath). */
  byDayAndGroup: Record<PracticeGroup, number>[];
  /** The days practised (1-based dates) and each one's minutes (Your sky). */
  practised: { date: number; practice: DayPractice }[];
  minutes: number;
}

/** This month's practice from the phone's own session log, reloaded whenever the screen comes into focus. */
export function useMonthPractice(): MonthPractice | null {
  const [month, setMonth] = useState<MonthPractice | null>(null);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const now = new Date();
      const { from, to, days } = monthBounds(now);
      sessionsBetween(from, to)
        .then((sessions) => {
          if (!alive) return;
          const byDay = practiceByDay(sessions);
          const practised = Array.from({ length: days }, (_, i) => i + 1)
            .map((date) => ({ date, practice: byDay.get(dayKey(new Date(from.getFullYear(), from.getMonth(), date))) }))
            .filter((d): d is { date: number; practice: DayPractice } => !!d.practice);
          setMonth({
            from,
            days,
            today: now.getDate() - 1,
            sessions,
            byDayAndGroup: minutesByDayAndGroup(sessions, from, days),
            practised,
            minutes: Math.round(sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60),
          });
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []),
  );
  return month;
}
