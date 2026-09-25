import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Video as VideoIcon,
  Headphones,
  Maximize2,
  Minimize2,
  Infinity as InfinityIcon,
  CheckCircle2,
  Minus,
  Plus,
} from 'lucide-react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography, alpha, nightPalette } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { pingActivity, recordTanafasSession } from '@/lib/usageTracking';
import { logSession } from '@/lib/sessionLog';
import AmbientVisual from './AmbientVisual';
import type { MeditationScene } from './scenes';

/**
 * The player is a permanently dark focus mode in both themes: its controls
 * sit over full-screen video, so they use the Nightlight palette directly
 * (Midnight ground, Moonlight chrome) rather than switching with Day.
 */
const FOCUS = { midnight: nightPalette.midnight, moonlight: nightPalette.moonlight };

const SESSION_OPTIONS = [5, 10, 20] as const;
/** How long the player's UI stays visible without interaction before fading out, while actively playing. */
const CONTROLS_IDLE_MS = 3000;
const CONTROLS_FADE_IN_MS = 200;
const CONTROLS_FADE_OUT_MS = 400;
const CUSTOM_MIN_MINUTES = 1;
const CUSTOM_MAX_MINUTES = 180;
const DEFAULT_CUSTOM_MINUTES = 25;
const CUSTOM_STEP_MINUTES = 5;
const TICK_MS = 1000;
/** Ambient audio fades out over the last few seconds instead of cutting abruptly at completion. */
const FADE_OUT_SECONDS = 5;
/** Persists across sessions — mainly for people who fall asleep to the audio and don't want video re-enabled by default next time. */
const AUDIO_ONLY_STORAGE_KEY = 'houna-meditation-audio-only';

interface MeditationPlayerProps {
  scene: MeditationScene;
  sceneName: string;
  sceneDescription: string;
  placeholderNotice: string;
  onExit: () => void;
}

/**
 * Ambient meditation player — hardcoded dark/white regardless of theme, per
 * CLAUDE.md's explicit exception for the meditation player. Open-ended
 * ambience rather than phase-cycling, so this doesn't reuse
 * PhaseBreathingSession; the session-length/pause/resume/complete shape is
 * still deliberately consistent with it.
 */
export default function MeditationPlayer({
  scene,
  sceneName,
  sceneDescription,
  placeholderNotice,
  onExit,
}: MeditationPlayerProps) {
  const { t, isRTL, fonts } = useLanguage();
  const p = t.tanafas.meditation.player;

  useEffect(() => {
    const tag = 'houna-meditation';
    // useKeepAwake() leaves its web wake-lock request unhandled on
    // rejection (denied permission, unsupported browser); calling the
    // underlying functions directly lets us swallow that non-fatal case.
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, []);

  // Lets audio keep playing once the app is backgrounded or the phone is
  // locked (Android only for now — untested on iOS, which additionally
  // needs `UIBackgroundModes: ["audio"]` in app.json and a build that
  // isn't Expo Go). `doNotMix` requests real audio focus, which is also
  // what makes an incoming-call interruption actually reach the app.
  useEffect(() => {
    setAudioModeAsync({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Tracks foreground/background so the muted ambient video can stop
  // decoding while backgrounded — it isn't visible then anyway. Audio
  // playback itself is untouched by this; see the `isActive` effect below.
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setIsForeground(state === 'active'));
    return () => sub.remove();
  }, []);

  const [sessionMinutes, setSessionMinutes] = useState<number>(10);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isInfiniteSession, setIsInfiniteSession] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [visualEnabled, setVisualEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUDIO_ONLY_STORAGE_KEY).then((value) => {
      if (value === 'true') setVisualEnabled(false);
    });
  }, []);

  // Android system nav bar — a no-op promise on iOS/web. Restored to
  // visible on unmount rather than left hidden after exiting the player.
  useEffect(() => {
    NavigationBar.setVisibilityAsync(isFullscreen ? 'hidden' : 'visible').catch(() => {});
  }, [isFullscreen]);

  useEffect(() => {
    return () => {
      NavigationBar.setVisibilityAsync('visible').catch(() => {});
    };
  }, []);

  const handleToggleAudioOnly = () => {
    setVisualEnabled((prev) => {
      const next = !prev;
      AsyncStorage.setItem(AUDIO_ONLY_STORAGE_KEY, String(!next)).catch(() => {});
      return next;
    });
  };

  const selectPreset = (mins: number) => {
    setIsCustomMode(false);
    setIsInfiniteSession(false);
    setSessionMinutes(mins);
  };

  const selectCustom = () => {
    setIsCustomMode(true);
    setIsInfiniteSession(false);
    setSessionMinutes((prev) => ((SESSION_OPTIONS as readonly number[]).includes(prev) ? DEFAULT_CUSTOM_MINUTES : prev));
  };

  const selectInfinite = () => {
    setIsCustomMode(true);
    setIsInfiniteSession(true);
  };

  const clampCustomMinutes = (total: number) => Math.min(CUSTOM_MAX_MINUTES, Math.max(CUSTOM_MIN_MINUTES, total));

  const stepCustom = (delta: number) => {
    setIsInfiniteSession(false);
    setSessionMinutes((prev) => clampCustomMinutes(prev + delta));
  };

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // A genuinely infinite total (not a huge finite number) so the completion
  // check below (`next >= totalSeconds`) and the near-end audio fade-out
  // never trigger — the session only ever ends when the user stops it.
  const totalSeconds = isInfiniteSession ? Infinity : sessionMinutes * 60;
  const hasRealMedia = !!scene.video;

  // `elapsed` is derived from wall-clock time, not ticked up by the
  // interval below — the JS thread (and therefore any setInterval) is
  // suspended while the app is backgrounded/locked, but the native audio
  // keeps playing regardless. Deriving from real timestamps means the
  // displayed time (and the completion/fade-out check) self-corrects the
  // instant the app returns to the foreground, instead of having silently
  // frozen for however long it was backgrounded. `elapsedBaseRef` is the
  // total of all previously-completed running segments; `segmentStartMsRef`
  // is when the current segment began (null while paused/not running).
  const elapsedBaseRef = useRef(0);
  const segmentStartMsRef = useRef<number | null>(null);
  const computeElapsedSeconds = useCallback(() => {
    if (segmentStartMsRef.current === null) return elapsedBaseRef.current;
    return elapsedBaseRef.current + Math.floor((Date.now() - segmentStartMsRef.current) / 1000);
  }, []);

  const audioPlayer = useAudioPlayer(scene.audio);
  const releaseLockScreenRef = useRef<() => void>(() => {});
  const fadingOutRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    audioPlayer.loop = true;
  }, [audioPlayer]);

  const stopFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const fadeAudioOut = useCallback(() => {
    if (!scene.audio) return;
    stopFade();
    const steps = 10;
    const stepDuration = (FADE_OUT_SECONDS * 1000) / steps;
    let step = 0;
    fadeIntervalRef.current = setInterval(() => {
      step++;
      audioPlayer.volume = Math.max(0, 1 - step / steps);
      if (step >= steps) {
        stopFade();
        audioPlayer.pause();
      }
    }, stepDuration);
  }, [audioPlayer, scene.audio, stopFade]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Usage tracking (Alias users only — see lib/usageTracking.ts): set when a
  // session actually starts, recorded and cleared whichever way it ends
  // first — natural completion, a manual reset, or exiting — so infinite
  // sessions (which never hit natural completion) still get counted.
  const sessionStartRef = useRef<Date | null>(null);
  const recordIfStarted = useCallback((endedAt: Date) => {
    if (sessionStartRef.current) {
      recordTanafasSession('meditation', sessionStartRef.current, endedAt).catch(() => {});
      logSession('meditation', scene.id, sessionStartRef.current, endedAt).catch(() => {});
      sessionStartRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    stopFade();
    recordIfStarted(new Date());
    setIsRunning(false);
    setIsPaused(false);
    setElapsed(0);
    setIsComplete(false);
    fadingOutRef.current = false;
    elapsedBaseRef.current = 0;
    segmentStartMsRef.current = null;
    if (scene.audio) audioPlayer.volume = 1;
    releaseLockScreenRef.current();
  }, [stop, stopFade, recordIfStarted, scene.audio, audioPlayer]);

  const tickAndCheckCompletion = useCallback(() => {
    const rawElapsed = computeElapsedSeconds();
    const remaining = totalSeconds - rawElapsed;
    if (remaining > 0 && remaining <= FADE_OUT_SECONDS && !fadingOutRef.current) {
      fadingOutRef.current = true;
      fadeAudioOut();
    }
    if (rawElapsed >= totalSeconds) {
      setElapsed(totalSeconds);
      stop();
      setIsRunning(false);
      setIsComplete(true);
      recordIfStarted(new Date());
      releaseLockScreenRef.current();
    } else {
      setElapsed(rawElapsed);
    }
  }, [computeElapsedSeconds, totalSeconds, fadeAudioOut, stop, recordIfStarted]);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    intervalRef.current = setInterval(tickAndCheckCompletion, TICK_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, tickAndCheckCompletion]);

  // Recompute immediately on returning to the foreground, rather than
  // waiting up to a full tick — this is what makes a session that finished
  // its target duration while backgrounded actually complete (fade-out,
  // isComplete, usage tracking) as soon as the app is reopened.
  useEffect(() => {
    if (isForeground && isRunning && !isPaused) {
      tickAndCheckCompletion();
    }
  }, [isForeground, isRunning, isPaused, tickAndCheckCompletion]);

  const isActive = isRunning && !isPaused;

  useEffect(() => {
    if (!scene.audio) return;
    if (isActive) {
      audioPlayer.play();
      // Makes this the lock-screen media player, which runs expo-audio's
      // media-playback foreground service. Without it Android freezes the
      // backgrounded app after ~90s and the audio stops while locked, even
      // with shouldPlayInBackground set.
      try {
        audioPlayer.setActiveForLockScreen(true, { title: t.tanafas.meditation.scenes[scene.id].name, artist: 'Houna' });
      } catch {
        // Non-fatal: playback still works in the foreground.
      }
    } else audioPlayer.pause();
  }, [isActive, scene.audio, scene.id, audioPlayer, t]);

  /** Drops the lock-screen player (and its foreground service) when a session ends. Only call while mounted. */
  const releaseLockScreen = useCallback(() => {
    if (!scene.audio) return;
    try {
      audioPlayer.clearLockScreenControls();
    } catch {
      // Already cleared.
    }
  }, [audioPlayer, scene.audio]);
  releaseLockScreenRef.current = releaseLockScreen;

  // Auto-hide the header/timer/controls while actively playing, so the
  // ambient scene is unobstructed — matches ordinary video-player UX. Stays
  // fully visible whenever not actively playing (choosing a session, paused,
  // complete), since the user needs those controls reachable then.
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const [controlsInteractive, setControlsInteractive] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showControls = useCallback(() => {
    clearHideTimer();
    setControlsInteractive(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: CONTROLS_FADE_IN_MS,
      useNativeDriver: true,
    }).start();
  }, [clearHideTimer, controlsOpacity]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: CONTROLS_FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setControlsInteractive(false);
      });
    }, CONTROLS_IDLE_MS);
  }, [clearHideTimer, controlsOpacity]);

  useEffect(() => {
    if (isActive) {
      showControls();
      scheduleHide();
    } else {
      clearHideTimer();
      showControls();
    }
    return clearHideTimer;
  }, [isActive, showControls, scheduleHide, clearHideTimer]);

  const handleScreenTap = () => {
    if (!isActive) return;
    showControls();
    scheduleHide();
  };

  useEffect(() => {
    // No explicit pause here: useAudioPlayer releases its native player on
    // unmount by itself, which already stops playback. Calling pause()
    // afterward would race that release and crash on an already-destroyed
    // shared object.
    return () => {
      stopFade();
    };
  }, [stopFade]);

  const handleStart = () => {
    if (isComplete) reset();
    sessionStartRef.current = new Date();
    pingActivity('meditation').catch(() => {});
    segmentStartMsRef.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);
  };
  const handlePause = () => {
    elapsedBaseRef.current = computeElapsedSeconds();
    segmentStartMsRef.current = null;
    setElapsed(elapsedBaseRef.current);
    setIsPaused(true);
  };
  const handleResume = () => {
    segmentStartMsRef.current = Date.now();
    setIsPaused(false);
  };
  const handleReset = () => reset();
  const handleExit = () => {
    stop();
    recordIfStarted(new Date());
    onExit();
  };

  // Infinite sessions have no "remaining" to count down — show elapsed
  // time counting up instead, with a matching "elapsed" label below.
  const displaySeconds = isInfiniteSession ? elapsed : Math.max(totalSeconds - elapsed, 0);
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const num = (n: number | string) => (isRTL ? arabicNumber(n) : String(n));
  const timeLabel = `${num(mins)}:${num(String(secs).padStart(2, '0'))}`;

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} style="light" />
      {visualEnabled ? (
        <AmbientVisual scene={scene} animate={isActive && isForeground} />
      ) : (
        <View style={styles.audioOnlyBg}>
          <Headphones size={40} color={alpha(FOCUS.moonlight, 0.22)} strokeWidth={1.2} />
        </View>
      )}

      {/* Sits above the ambient visual but below the controls overlay — an
          independent sibling, not a parent, of the button Pressables below,
          so it only ever catches taps that miss an active button rather
          than racing/swallowing their touches. DOM source order alone
          doesn't reliably decide stacking here on web, so the zIndex on
          both this and the overlay below is load-bearing, not decorative —
          don't remove it. */}
      <Pressable style={[StyleSheet.absoluteFillObject, styles.tapCatcher]} onPress={handleScreenTap} />

      <Animated.View
        style={[styles.overlay, { opacity: controlsOpacity }]}
        pointerEvents={controlsInteractive ? 'auto' : 'none'}
      >
        <SafeAreaView style={styles.overlayInner} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleExit}
            hitSlop={16}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.15), borderRadius: radius.full },
            ]}
          >
            <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft size={22} color={FOCUS.moonlight} />
</View>
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>{sceneName}</Text>
            {!isRunning && !isComplete && (
              <Text style={[styles.headerSubtitle, { fontFamily: fonts.regular }]}>{sceneDescription}</Text>
            )}
          </View>
          <Pressable
            onPress={() => setIsFullscreen((v) => !v)}
            hitSlop={16}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.15), borderRadius: radius.full },
            ]}
            accessibilityLabel={isFullscreen ? p.exitFullscreen : p.fullscreen}
          >
            {isFullscreen ? (
              <Minimize2 size={20} color={FOCUS.moonlight} />
            ) : (
              <Maximize2 size={20} color={FOCUS.moonlight} />
            )}
          </Pressable>
        </View>

        <View style={styles.main}>
          {isComplete ? (
            <View style={styles.completionWrap}>
              <CheckCircle2 size={56} color={FOCUS.moonlight} strokeWidth={1.5} />
              <Text style={[styles.completionTitle, { fontFamily: fonts.bold }]}>{p.wellDone}</Text>
              <Text style={[styles.completionBody, { fontFamily: fonts.regular }]}>{p.completionBody}</Text>
            </View>
          ) : isRunning ? (
            <View style={styles.timeWrap}>
              <Text style={[styles.timeText, { fontFamily: fonts.bold }]}>{timeLabel}</Text>
              <Text style={[styles.remainingLabel, { fontFamily: fonts.regular }]}>
                {isInfiniteSession ? p.elapsed : p.remaining}
              </Text>
            </View>
          ) : (
            <View style={styles.selectorWrap}>
              <Text style={[styles.selectorLabel, { fontFamily: fonts.semiBold }]}>{p.chooseSession}</Text>
              <View style={styles.selectorRow}>
                {SESSION_OPTIONS.map((mins) => {
                  const active = !isCustomMode && mins === sessionMinutes;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => selectPreset(mins)}
                      style={({ pressed }) => [
                        styles.pill,
                        active && styles.pillActive,
                        pressed && (active ? { opacity: 0.85 } : { backgroundColor: alpha(FOCUS.moonlight, 0.15) }),
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          { fontFamily: fonts.semiBold },
                          active && styles.pillTextActive,
                        ]}
                      >
                        {num(mins)} {arabicPlural(mins, p.min)}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={selectCustom}
                  style={({ pressed }) => [
                    styles.pill,
                    isCustomMode && styles.pillActive,
                    pressed && (isCustomMode ? { opacity: 0.85 } : { backgroundColor: alpha(FOCUS.moonlight, 0.15) }),
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { fontFamily: fonts.semiBold },
                      isCustomMode && styles.pillTextActive,
                    ]}
                  >
                    {p.custom}
                  </Text>
                </Pressable>
              </View>

              {isCustomMode && (
                <View style={styles.customWrap}>
                  <View style={styles.stepperRow}>
                    <Pressable
                      onPress={() => stepCustom(-CUSTOM_STEP_MINUTES)}
                      disabled={isInfiniteSession}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.stepperBtn,
                        isInfiniteSession && styles.stepperBtnDisabled,
                        pressed && !isInfiniteSession && { backgroundColor: alpha(FOCUS.moonlight, 0.28) },
                      ]}
                    >
                      <Minus size={20} color={isInfiniteSession ? alpha(FOCUS.moonlight, 0.35) : FOCUS.moonlight} strokeWidth={2.4} />
                    </Pressable>

                    <Text
                      style={[
                        styles.customValue,
                        { fontFamily: fonts.bold },
                        isInfiniteSession && styles.customValueDisabled,
                      ]}
                    >
                      {num(sessionMinutes)} {arabicPlural(sessionMinutes, p.min)}
                    </Text>

                    <Pressable
                      onPress={() => stepCustom(CUSTOM_STEP_MINUTES)}
                      disabled={isInfiniteSession}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.stepperBtn,
                        isInfiniteSession && styles.stepperBtnDisabled,
                        pressed && !isInfiniteSession && { backgroundColor: alpha(FOCUS.moonlight, 0.28) },
                      ]}
                    >
                      <Plus size={20} color={isInfiniteSession ? alpha(FOCUS.moonlight, 0.35) : FOCUS.moonlight} strokeWidth={2.4} />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={selectInfinite}
                    style={({ pressed }) => [
                      styles.infinityPill,
                      isInfiniteSession && styles.infinityPillActive,
                      pressed && !isInfiniteSession && { backgroundColor: alpha(FOCUS.moonlight, 0.15) },
                    ]}
                  >
                    <InfinityIcon size={16} color={isInfiniteSession ? FOCUS.midnight : FOCUS.moonlight} strokeWidth={2} />
                    <Text
                      style={[
                        styles.infinityPillText,
                        { fontFamily: fonts.semiBold },
                        isInfiniteSession && styles.infinityPillTextActive,
                      ]}
                    >
                      {p.noLimit}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {!hasRealMedia && (
          <Text style={[styles.placeholderNotice, { fontFamily: fonts.regular }]}>{placeholderNotice}</Text>
        )}

        <View style={styles.controls}>
          {!isComplete && (
            <Pressable
              onPress={handleToggleAudioOnly}
              style={({ pressed }) => [styles.smallIconBtn, pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.24) }]}
              accessibilityLabel={visualEnabled ? p.audioOnly : p.videoOn}
            >
              {visualEnabled ? (
                <VideoIcon size={18} color={FOCUS.moonlight} />
              ) : (
                <Headphones size={18} color={FOCUS.moonlight} />
              )}
            </Pressable>
          )}

          {!isRunning && !isComplete && (
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [styles.primaryBtn, pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.32) }]}
            >
              <Play size={22} color={FOCUS.moonlight} fill={FOCUS.moonlight} />
              <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>{p.begin}</Text>
            </Pressable>
          )}

          {isActive && (
            <Pressable
              onPress={handlePause}
              style={({ pressed }) => [styles.primaryBtn, pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.32) }]}
            >
              <Pause size={22} color={FOCUS.moonlight} fill={FOCUS.moonlight} />
              <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>{p.pause}</Text>
            </Pressable>
          )}

          {isPaused && (
            <Pressable
              onPress={handleResume}
              style={({ pressed }) => [styles.primaryBtn, pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.32) }]}
            >
              <Play size={22} color={FOCUS.moonlight} fill={FOCUS.moonlight} />
              <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>{p.resume}</Text>
            </Pressable>
          )}

          {isComplete && (
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [styles.primaryBtn, pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.32) }]}
            >
              <RotateCcw size={20} color={FOCUS.moonlight} />
              <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>{p.startAgain}</Text>
            </Pressable>
          )}

          {isRunning && (
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.smallIconBtn, pressed && { backgroundColor: alpha(FOCUS.moonlight, 0.24) }]}
              accessibilityLabel={p.startAgain}
            >
              <RotateCcw size={18} color={FOCUS.moonlight} />
            </Pressable>
          )}
        </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FOCUS.midnight,
  },
  audioOnlyBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FOCUS.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapCatcher: {
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    zIndex: 2,
  },
  overlayInner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  headerTextWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: FOCUS.moonlight,
    fontSize: typography.fontSize.md,
  },
  headerSubtitle: {
    color: alpha(FOCUS.moonlight, 0.75),
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  selectorWrap: {
    alignItems: 'center',
  },
  selectorLabel: {
    color: alpha(FOCUS.moonlight, 0.85),
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  customWrap: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(FOCUS.moonlight, 0.14),
    borderWidth: 1,
    borderColor: alpha(FOCUS.moonlight, 0.4),
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  customValue: {
    color: FOCUS.moonlight,
    fontSize: typography.fontSize.xxl,
    minWidth: 130,
    textAlign: 'center',
  },
  customValueDisabled: {
    color: alpha(FOCUS.moonlight, 0.5),
  },
  infinityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 34,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: alpha(FOCUS.moonlight, 0.4),
  },
  infinityPillActive: {
    backgroundColor: FOCUS.moonlight,
    borderColor: FOCUS.moonlight,
  },
  infinityPillText: {
    color: FOCUS.moonlight,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  infinityPillTextActive: {
    color: FOCUS.midnight,
  },
  pill: {
    height: 34,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: alpha(FOCUS.moonlight, 0.4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: FOCUS.moonlight,
    borderColor: FOCUS.moonlight,
  },
  pillText: {
    color: FOCUS.moonlight,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  pillTextActive: {
    color: FOCUS.midnight,
  },
  timeWrap: {
    alignItems: 'center',
  },
  timeText: {
    color: FOCUS.moonlight,
    fontSize: 64,
    fontVariant: ['tabular-nums'],
  },
  remainingLabel: {
    color: alpha(FOCUS.moonlight, 0.75),
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  completionWrap: {
    alignItems: 'center',
    maxWidth: 300,
  },
  completionTitle: {
    color: FOCUS.moonlight,
    fontSize: typography.fontSize.xxl,
    marginTop: spacing.lg,
  },
  completionBody: {
    color: alpha(FOCUS.moonlight, 0.85),
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  placeholderNotice: {
    color: alpha(FOCUS.moonlight, 0.55),
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  primaryBtn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: alpha(FOCUS.moonlight, 0.18),
    borderWidth: 1,
    borderColor: alpha(FOCUS.moonlight, 0.4),
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  primaryBtnText: {
    color: FOCUS.moonlight,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  smallIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(FOCUS.moonlight, 0.12),
    borderWidth: 1,
    borderColor: alpha(FOCUS.moonlight, 0.3),
  },
});
