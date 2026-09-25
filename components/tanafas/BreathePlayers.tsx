import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, RotateCcw } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, nightPalette } from '@/constants/theme';
import {
  BREATH_PATTERNS,
  BREATHE_TONE,
  DEFAULT_SESSION_MINUTES,
  RELEASE_MS,
  SESSION_MINUTES,
  TENSE_MS,
  type BreatheKey,
  type BreathPhase,
} from '@/constants/breathPatterns';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { logSession } from '@/lib/sessionLog';
import { pingActivity, recordTanafasSession } from '@/lib/usageTracking';
import { useSessionLog } from '@/hooks/useSessionLog';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';
import type { IconTileTone } from '@/components/ui/IconTile';
import { BreathStage, NATIVE_DRIVER } from './BreatheStages';
import PlayerFrame, {
  Body,
  FadeIn,
  Heading,
  InfoTiles,
  MainButton,
  ProgressInfo,
  SideButton,
  SideSpacer,
  Tag,
  Tile,
  TrackedLabel,
  type CarouselNav,
} from './PlayerFrame';

/**
 * The Breathe carousel's exercises, each run in place on the Tanafas hub:
 * pressing play doesn't open a new screen — the stage starts breathing and
 * the title, tag, description and tiles fade over to the session's round,
 * phase and time left. Back from the first step (or "End session") returns
 * to the carousel.
 */

interface PlayerProps {
  exercise: BreatheKey;
  /** The orb's fill, shared with the hub's screen glow so the whole screen breathes. */
  breath: Animated.Value;
  nav: CarouselNav;
}

export default function BreathePlayer(props: PlayerProps) {
  switch (props.exercise) {
    case 'anxiety-relief':
    case 'steady-mind':
      return <PhasePlayer key={props.exercise} {...props} />;
    case 'panic-relief':
      return <GroundingPlayer {...props} />;
    case 'tension-release':
      return <TensionPlayer {...props} />;
  }
}

const EXERCISE_TEXT = {
  'anxiety-relief': 'anxietyRelief',
  'steady-mind': 'steadyMind',
  'panic-relief': 'panicRelief',
  'tension-release': 'tensionRelease',
} as const;

/** Glow for the round button and the screen, from the Nightlight swatch of the tone. */
export function toneGlow(tone: IconTileTone, a = 0.3): string {
  return alpha(tone === 'dusk' ? nightPalette.dusk : tone === 'dawn' ? nightPalette.dawn : nightPalette.hounaGlow, a);
}

function useNum() {
  const { isRTL } = useLanguage();
  return (n: number) => (isRTL ? arabicNumber(n) : String(n));
}

/** Eases the shared breath value somewhere, cancelling whatever it was doing. */
function settle(breath: Animated.Value, toValue: number, duration = 700) {
  breath.stopAnimation();
  Animated.timing(breath, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }).start();
}

/** The carousel view of an exercise: title, technique tag, description, tiles, play. */
function useIdleSlots(exercise: BreatheKey) {
  const { t } = useLanguage();
  const h = t.discover.hub;
  const e = t.tanafas.exercises[EXERCISE_TEXT[exercise]];
  const tone = BREATHE_TONE[exercise];
  return {
    e,
    tone,
    heading: <Heading>{e.title}</Heading>,
    label: <Tag label={e.subtitle.replace(/[()]/g, '').trim()} tone={tone} />,
    body: <Body>{e.description}</Body>,
    patternTile: <Tile label={h.pattern}>{h.patterns[EXERCISE_TEXT[exercise]]}</Tile>,
    durationTile: <Tile label={h.duration}>{e.duration}</Tile>,
    beginLabel: `${h.begin} — ${e.title}`,
  };
}

function PlayIcon(c: string) {
  return <CanvasIcon name="play" size={28} color={c} />;
}

function EndButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <SideButton label={label} onPress={onPress} renderIcon={(c) => <CanvasIcon name="close" size={20} strokeWidth={1.8} color={c} />} />;
}

/* ──────────────── Timed breathing (4-7-8, box) ──────────────── */

type Status = 'idle' | 'running' | 'paused' | 'complete';

interface Clock {
  phase: number;
  round: number;
  /** Seconds into the current phase / the whole session. */
  inPhase: number;
  total: number;
}

const START: Clock = { phase: 0, round: 1, inPhase: 0, total: 0 };

/**
 * The phase state machine for timed patterns: rounds of phases until the
 * chosen length runs out. Drives `breath` (the orb fills on inhale, holds,
 * empties on exhale) and `trace` (the box-breathing bead, one side a phase)
 * as native animations timed to each phase, so pausing freezes them mid-breath.
 */
function useBreathCycle(exercise: BreatheKey, phases: readonly BreathPhase[], minutes: number, breath: Animated.Value, trace: Animated.Value) {
  const [status, setStatus] = useState<Status>('idle');
  const [clock, setClock] = useState<Clock>(START);
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const totalSeconds = minutes * 60;
  const roundSeconds = phases.reduce((sum, p) => sum + p.seconds, 0);
  const totalRounds = Math.ceil(totalSeconds / roundSeconds);

  // Streaks (Aliases, exercise sessions only) and the on-device Recap log:
  // recorded once, whichever way the session ends.
  const startedAt = useRef<Date | null>(null);
  const record = useCallback(() => {
    if (!startedAt.current) return;
    const end = new Date();
    recordTanafasSession('breathing', startedAt.current, end).catch(() => {});
    logSession('breathing', exercise, startedAt.current, end).catch(() => {});
    startedAt.current = null;
  }, [exercise]);
  useEffect(() => record, [record]);

  // Clock: real elapsed time, advancing phases and rounds as they run out.
  useEffect(() => {
    if (status !== 'running') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      setClock((c) => {
        let { phase, round, inPhase } = c;
        inPhase += dt;
        while (inPhase >= phases[phase].seconds) {
          inPhase -= phases[phase].seconds;
          phase = (phase + 1) % phases.length;
          if (phase === 0) round += 1;
        }
        return { phase, round, inPhase, total: Math.min(c.total + dt, totalSeconds) };
      });
    }, 100);
    return () => clearInterval(id);
  }, [status, phases, totalSeconds]);

  useEffect(() => {
    if (status === 'running' && clock.total >= totalSeconds) {
      setStatus('complete');
      record();
    }
  }, [status, clock.total, totalSeconds, record]);

  // Animation: each phase eases the orb to its fill over the phase's remaining time.
  useEffect(() => {
    if (status === 'paused') return;
    if (status !== 'running') {
      settle(breath, 0);
      trace.setValue(0);
      return;
    }
    const p = phases[clock.phase];
    const { inPhase } = clockRef.current;
    const remaining = Math.max(p.seconds - inPhase, 0) * 1000;
    if (clock.phase === 0 && inPhase < 0.25) trace.setValue(0);
    const anim = Animated.parallel([
      Animated.timing(breath, { toValue: p.fill, duration: remaining, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(trace, { toValue: clock.phase + 1, duration: remaining, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }),
    ]);
    anim.start();
    return () => anim.stop();
    // Keyed on the phase/round, not the ticking clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, clock.phase, clock.round]);

  const start = () => {
    setClock(START);
    startedAt.current = new Date();
    pingActivity('breathing').catch(() => {});
    setStatus('running');
  };
  const reset = () => {
    record();
    setClock(START);
    setStatus('idle');
  };

  return {
    status,
    clock,
    totalRounds,
    progress: Math.min(clock.total / totalSeconds, 1),
    secondsLeft: Math.max(Math.ceil(totalSeconds - clock.total), 0),
    start,
    reset,
    pause: () => setStatus('paused'),
    resume: () => setStatus('running'),
  };
}

function PhasePlayer({ exercise, breath, nav }: PlayerProps) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const s = t.tanafas.session;
  const num = useNum();
  const idle = useIdleSlots(exercise);
  const { e, tone } = idle;
  const accent = colors.tones[tone].fg;
  const phases = BREATH_PATTERNS[exercise as 'anxiety-relief' | 'steady-mind'];
  const phaseLabel = (p: BreathPhase) => ('inhale' in e ? e[p.key] : p.key);

  const [minutes, setMinutes] = useState(DEFAULT_SESSION_MINUTES);
  const trace = useRef(new Animated.Value(0)).current;
  const cycle = useBreathCycle(exercise, phases, minutes, breath, trace);
  const { status, clock } = cycle;
  const inSession = status === 'running' || status === 'paused';
  const mode = inSession ? 'session' : status;

  const clockText = `${num(Math.floor(cycle.secondsLeft / 60))}:${num(cycle.secondsLeft % 60).padStart(2, num(0))}`;
  const roundsDone = Math.max(clock.round - 1, 1);

  const lengthTile = (
    <Tile label={t.discover.hub.duration}>
      <View style={styles.lengths}>
        {SESSION_MINUTES.map((m) => {
          const selected = m === minutes;
          return (
            <Pressable
              key={m}
              onPress={() => setMinutes(m)}
              hitSlop={8}
              accessibilityRole="button"
              aria-selected={selected}
              accessibilityLabel={`${num(m)} ${m === 1 ? s.min : s.minPlural}`}
              style={[styles.length, { borderBottomColor: selected ? accent : 'transparent' }]}
            >
              <Text style={[styles.lengthText, { color: selected ? colors.text : colors.textTertiary, fontFamily: selected ? fonts.semiBold : fonts.medium }]}>
                {num(m)}
              </Text>
            </Pressable>
          );
        })}
        <Text style={[styles.lengthText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.minPlural}</Text>
      </View>
    </Tile>
  );

  return (
    <PlayerFrame
      mode={mode}
      nav={status === 'idle' ? nav : null}
      stage={
        <BreathStage
          shape={exercise === 'steady-mind' ? 'square' : 'ring'}
          tone={tone}
          breath={breath}
          trace={trace}
          showTracer={inSession}
        />
      }
      heading={
        inSession ? (
          <FadeIn key={`${clock.round}-${clock.phase}`}>
            <Heading>{phaseLabel(phases[clock.phase])}</Heading>
          </FadeIn>
        ) : status === 'complete' ? (
          <Heading>{s.wellDone}</Heading>
        ) : (
          idle.heading
        )
      }
      label={
        inSession ? (
          <TrackedLabel color={accent}>{`${s.round} ${num(clock.round)} ${s.ofTotal} ${num(cycle.totalRounds)}`}</TrackedLabel>
        ) : status === 'complete' ? (
          <TrackedLabel color={accent}>{arabicPlural(roundsDone, s.roundsDone).replace('{n}', num(roundsDone))}</TrackedLabel>
        ) : (
          idle.label
        )
      }
      body={
        inSession ? (
          <View style={styles.phaseRow}>
            {phases.map((p, i) => (
              <TrackedLabel key={i} active={i === clock.phase}>
                {phaseLabel(p)}
              </TrackedLabel>
            ))}
          </View>
        ) : status === 'complete' ? (
          <Body>{e.completionBody}</Body>
        ) : (
          idle.body
        )
      }
      info={
        inSession ? (
          <ProgressInfo progress={cycle.progress} color={accent} label={status === 'paused' ? s.paused : s.timeLeft.replace('{t}', clockText)} />
        ) : status === 'complete' ? null : (
          <InfoTiles>
            {idle.patternTile}
            {lengthTile}
          </InfoTiles>
        )
      }
      controls={
        inSession ? (
          <>
            <SideButton label={s.end} onPress={cycle.reset} renderIcon={(c) => <RotateCcw size={22} color={c} strokeWidth={1.7} />} />
            <MainButton
              label={status === 'running' ? s.pause : s.resume}
              glow={toneGlow(tone)}
              onPress={status === 'running' ? cycle.pause : cycle.resume}
              renderIcon={(c) => <CanvasIcon name={status === 'running' ? 'pause' : 'play'} size={28} color={c} />}
            />
            <SideSpacer />
          </>
        ) : status === 'complete' ? (
          <>
            <EndButton label={s.done} onPress={cycle.reset} />
            <MainButton label={s.startAgain} glow={toneGlow(tone)} onPress={cycle.start} renderIcon={(c) => <RotateCcw size={26} color={c} strokeWidth={1.8} />} />
            <SideSpacer />
          </>
        ) : (
          <>
            <SideSpacer />
            <MainButton label={idle.beginLabel} glow={toneGlow(tone)} onPress={cycle.start} renderIcon={PlayIcon} />
            <SideSpacer />
          </>
        )
      }
    />
  );
}

/* ──────────────── Five-senses grounding (5-4-3-2-1) ──────────────── */

function GroundingPlayer({ exercise, breath, nav }: PlayerProps) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const s = t.tanafas.session;
  const ex = t.tanafas.exercises.panicRelief;
  const num = useNum();
  const idle = useIdleSlots(exercise);
  const { tone } = idle;
  const accent = colors.tones[tone].fg;
  const steps = ex.steps;

  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [step, setStep] = useState(0);
  const log = useSessionLog('breathing', 'panic-relief');

  // The orb opens to the middle circle to hold the count, and rests otherwise.
  useEffect(() => settle(breath, status === 'running' ? 0.5 : 0), [status, breath]);

  const begin = () => {
    setStep(0);
    setStatus('running');
    log.start();
  };
  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      setStatus('complete');
      log.end();
    }
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
    else {
      setStatus('idle');
      log.end();
    }
  };
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const running = status === 'running';

  return (
    <PlayerFrame
      mode={status}
      nav={status === 'idle' ? nav : null}
      stage={
        <BreathStage
          shape="ring"
          tone={tone}
          breath={breath}
          progress={running ? (step + 1) / steps.length : status === 'complete' ? 1 : undefined}
        >
          {running && (
            <FadeIn key={step}>
              <Text style={[styles.count, isRTL && styles.countArabic, { color: nightPalette.midnight, fontFamily: fonts.semiBold }]}>{num(current.count)}</Text>
            </FadeIn>
          )}
        </BreathStage>
      }
      heading={
        running ? (
          <FadeIn key={step}>
            <Heading>{current.prompt}</Heading>
          </FadeIn>
        ) : status === 'complete' ? (
          <Heading>{ex.completionTitle}</Heading>
        ) : (
          idle.heading
        )
      }
      label={
        running ? (
          <TrackedLabel color={accent}>{ex.stepCounter(step + 1, steps.length, current.sense)}</TrackedLabel>
        ) : status === 'complete' ? (
          <TrackedLabel color={accent}>{ex.completionSubtitle}</TrackedLabel>
        ) : (
          idle.label
        )
      }
      body={running ? <Body>{ex.takeYourTime}</Body> : status === 'complete' ? <Body>{ex.completionBody}</Body> : idle.body}
      info={
        running ? (
          <View style={styles.steps} accessibilityRole="tablist">
            {steps.map((st, i) => (
              <Pressable
                key={i}
                onPress={() => setStep(i)}
                hitSlop={8}
                accessibilityRole="tab"
                aria-selected={i === step}
                accessibilityLabel={ex.stepCounter(i + 1, steps.length, st.sense)}
              >
                <View
                  style={[
                    styles.stepBar,
                    { width: i === step ? 24 : 8, backgroundColor: i === step ? accent : i < step ? alpha(accent, 0.45) : colors.borderControl },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        ) : status === 'complete' ? null : (
          <InfoTiles>
            {idle.patternTile}
            {idle.durationTile}
          </InfoTiles>
        )
      }
      controls={
        running ? (
          <>
            <SideButton
              label={t.directory.common.goBack}
              onPress={back}
              renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={22} strokeWidth={1.8} color={c} />}
            />
            <MainButton
              label={isLast ? ex.finish : ex.next}
              glow={toneGlow(tone)}
              onPress={next}
              renderIcon={(c) =>
                isLast ? <Check size={28} color={c} strokeWidth={2} /> : <DirectionalIcon isRTL={isRTL} name="arrow" size={28} strokeWidth={1.8} color={c} />
              }
            />
            <SideSpacer />
          </>
        ) : status === 'complete' ? (
          <>
            <EndButton label={s.done} onPress={() => setStatus('idle')} />
            <MainButton label={ex.startAgain} glow={toneGlow(tone)} onPress={begin} renderIcon={(c) => <RotateCcw size={26} color={c} strokeWidth={1.8} />} />
            <SideSpacer />
          </>
        ) : (
          <>
            <SideSpacer />
            <MainButton label={idle.beginLabel} glow={toneGlow(tone)} onPress={begin} renderIcon={PlayIcon} />
            <SideSpacer />
          </>
        )
      }
    />
  );
}

/* ──────────────── Progressive muscle relaxation ──────────────── */

function TensionPlayer({ exercise, breath, nav }: PlayerProps) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const s = t.tanafas.session;
  const ex = t.tanafas.exercises.tensionRelease;
  const num = useNum();
  const idle = useIdleSlots(exercise);
  const { tone } = idle;
  const accent = colors.tones[tone].fg;
  const groups = ex.groups;

  const [status, setStatus] = useState<Status>('idle');
  const [group, setGroup] = useState(0);
  const [phase, setPhase] = useState<'tense' | 'release'>('tense');
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const { start: logStart, end: logEnd } = useSessionLog('breathing', 'tension-release');
  const duration = phase === 'tense' ? TENSE_MS : RELEASE_MS;

  const goTo = useCallback((g: number, p: 'tense' | 'release') => {
    setGroup(g);
    setPhase(p);
    setElapsed(0);
  }, []);

  const advance = useCallback(() => {
    if (phase === 'tense') goTo(group, 'release');
    else if (group < groups.length - 1) goTo(group + 1, 'tense');
    else {
      setStatus('complete');
      logEnd();
    }
  }, [phase, group, groups.length, goTo, logEnd]);

  // Timer: counts the phase down, then moves on by itself.
  useEffect(() => {
    if (status !== 'running') return;
    const startedAt = Date.now() - elapsedRef.current;
    const id = setInterval(() => {
      const e = Date.now() - startedAt;
      if (e >= duration) {
        clearInterval(id);
        advance();
      } else setElapsed(e);
    }, 100);
    return () => clearInterval(id);
  }, [status, duration, advance]);

  // The orb draws in as you tense and opens as you let go.
  useEffect(() => {
    if (status === 'paused') return;
    if (status !== 'running') {
      settle(breath, 0);
      return;
    }
    const remaining = Math.max(duration - elapsedRef.current, 0);
    const easing = Easing.inOut(Easing.sin);
    const to = (toValue: number, ms: number) => Animated.timing(breath, { toValue, duration: ms, easing, useNativeDriver: NATIVE_DRIVER });
    // A fresh tense starts from open (it already is, after a release).
    const anim = phase === 'tense' ? (elapsedRef.current < 100 ? Animated.sequence([to(1, 500), to(0, remaining - 500)]) : to(0, remaining)) : to(1, remaining);
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, phase, group]);

  const begin = () => {
    goTo(0, 'tense');
    setStatus('running');
    logStart();
  };
  const back = () => {
    if (phase === 'release') goTo(group, 'tense');
    else if (group > 0) goTo(group - 1, 'release');
    else {
      setStatus('idle');
      logEnd();
    }
  };

  const inSession = status === 'running' || status === 'paused';
  const isTense = phase === 'tense';
  const isFinal = group === groups.length - 1 && !isTense;
  const current = groups[group];
  const secondsLeft = Math.max(Math.ceil((duration - elapsed) / 1000), 0);

  return (
    <PlayerFrame
      mode={inSession ? 'session' : status}
      nav={status === 'idle' ? nav : null}
      stage={
        // The same lit orb as the other exercises; the count sits on it in ink, as the play icon does on its light button.
        <BreathStage shape="ring" tone={tone} breath={breath}>
          {inSession && (
            <Text style={[styles.count, isRTL && styles.countArabic, { color: nightPalette.midnight, fontFamily: fonts.semiBold }]}>
              {num(secondsLeft)}
            </Text>
          )}
        </BreathStage>
      }
      heading={
        inSession ? (
          <FadeIn key={group}>
            <Heading>{current.name}</Heading>
          </FadeIn>
        ) : status === 'complete' ? (
          <Heading>{ex.wellDone}</Heading>
        ) : (
          idle.heading
        )
      }
      label={
        inSession ? (
          <FadeIn key={phase}>
            <TrackedLabel color={accent}>{isTense ? ex.tense : ex.release}</TrackedLabel>
          </FadeIn>
        ) : status === 'complete' ? (
          <TrackedLabel color={accent}>{ex.releasedTension}</TrackedLabel>
        ) : (
          idle.label
        )
      }
      body={
        inSession ? (
          <FadeIn key={`${group}-${phase}`}>
            <Body>{isTense ? current.tensePrompt : current.releasePrompt}</Body>
          </FadeIn>
        ) : status === 'complete' ? (
          <Body>{ex.completionBody}</Body>
        ) : (
          idle.body
        )
      }
      info={
        inSession ? (
          <ProgressInfo
            progress={elapsed / duration}
            color={accent}
            label={status === 'paused' ? ex.paused : `${ex.groupOf} ${num(group + 1)} ${ex.ofTotal} ${num(groups.length)}`}
          />
        ) : status === 'complete' ? null : (
          <InfoTiles>
            {idle.patternTile}
            {idle.durationTile}
          </InfoTiles>
        )
      }
      controls={
        inSession ? (
          <>
            <SideButton
              label={t.directory.common.goBack}
              onPress={back}
              renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={22} strokeWidth={1.8} color={c} />}
            />
            <MainButton
              label={status === 'running' ? s.pause : s.resume}
              glow={toneGlow(tone)}
              onPress={() => setStatus(status === 'running' ? 'paused' : 'running')}
              renderIcon={(c) => <CanvasIcon name={status === 'running' ? 'pause' : 'play'} size={28} color={c} />}
            />
            <SideButton
              label={isFinal ? ex.finish : ex.next}
              onPress={advance}
              renderIcon={(c) =>
                isFinal ? <Check size={22} color={c} strokeWidth={1.8} /> : <DirectionalIcon isRTL={isRTL} name="arrow" size={22} strokeWidth={1.8} color={c} />
              }
            />
          </>
        ) : status === 'complete' ? (
          <>
            <EndButton label={s.done} onPress={() => setStatus('idle')} />
            <MainButton label={ex.startAgain} glow={toneGlow(tone)} onPress={begin} renderIcon={(c) => <RotateCcw size={26} color={c} strokeWidth={1.8} />} />
            <SideSpacer />
          </>
        ) : (
          <>
            <SideSpacer />
            <MainButton label={idle.beginLabel} glow={toneGlow(tone)} onPress={begin} renderIcon={PlayIcon} />
            <SideSpacer />
          </>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  lengths: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  length: {
    borderBottomWidth: 2,
  },
  lengthText: {
    fontSize: 16,
  },
  phaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 4,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepBar: {
    height: 8,
    borderRadius: 4,
  },
  // The body face, not the display one: steadier numerals.
  count: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'center',
  },
  countArabic: {
    lineHeight: 56,
  },
});
