import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { MOOD_COLORS, MOOD_VALUES, localDateString, type JournalEntry, type MoodTag } from '@/lib/journal';

export interface DayPoint {
  dateStr: string;
  dayLabel: string;
  entry: JournalEntry | null;
}

interface MoodTrendChartProps {
  moodEntries: JournalEntry[];
  range: 7 | 30;
  dayLabelFor: (d: Date) => string;
  selectedDateStr: string | null;
  onSelectDate: (dateStr: string) => void;
}

const CHART_W = 320;
const CHART_H = 160;
const PAD_X = 28;
const PAD_TOP = 18;
const PAD_BOTTOM = 28;
const INNER_W = CHART_W - PAD_X * 2;
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM;

/** Ported from the old MVP's MoodHistoryScreen chart — same layout math, smoothing and axis logic, redrawn with react-native-svg. */
export default function MoodTrendChart({
  moodEntries,
  range,
  dayLabelFor,
  selectedDateStr,
  onSelectDate,
}: MoodTrendChartProps) {
  const days = useMemo<DayPoint[]>(() => {
    const result: DayPoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = localDateString(d);
      const entry = moodEntries.find((e) => e.date === dateStr) ?? null;
      result.push({ dateStr, dayLabel: dayLabelFor(d), entry });
    }
    return result;
  }, [moodEntries, range, dayLabelFor]);

  const daysWithMood = useMemo(() => days.filter((d) => d.entry !== null), [days]);

  const points = useMemo(() => {
    return daysWithMood.map((d, i) => {
      const x = PAD_X + (daysWithMood.length > 1 ? (i / (daysWithMood.length - 1)) * INNER_W : INNER_W / 2);
      const moodVal = MOOD_VALUES[d.entry!.mood];
      const y = PAD_TOP + (1 - (moodVal - 1) / 5) * INNER_H;
      return { x, y, dateStr: d.dateStr, label: d.dayLabel, mood: d.entry!.mood as MoodTag };
    });
  }, [daysWithMood]);

  const smoothPath = useMemo(() => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return path;
  }, [points]);

  const showEveryLabel = range === 7;
  const edgeLabelIndices = new Set<number>(
    points.length > 0
      ? [0, Math.floor(points.length / 2), points.length - 1].filter((i) => i > 0 || points.length === 1)
      : [],
  );

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H}>
        {[6, 1].map((val) => {
          const y = PAD_TOP + (1 - (val - 1) / 5) * INNER_H;
          return (
            <Line
              key={val}
              x1={PAD_X}
              y1={y}
              x2={CHART_W - PAD_X}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
            />
          );
        })}

        {!!smoothPath && (
          <Path d={smoothPath} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
        )}

        {points.map((p, i) => {
          const selected = selectedDateStr === p.dateStr;
          const showLabel = showEveryLabel || edgeLabelIndices.has(i);
          return (
            <React.Fragment key={p.dateStr}>
              <Circle cx={p.x} cy={p.y} r={14} fill="transparent" onPress={() => onSelectDate(p.dateStr)} />
              <Circle
                cx={p.x}
                cy={p.y}
                r={selected ? 7 : 5}
                fill={MOOD_COLORS[p.mood]}
                stroke="#ffffff"
                strokeWidth={1.5}
                onPress={() => onSelectDate(p.dateStr)}
              />
              {showLabel && (
                <SvgText x={p.x} y={CHART_H - 6} fontSize={9} fill={colors.textTertiary} textAnchor="middle">
                  {p.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
