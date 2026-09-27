import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUNRISE_ACCENTS, sunriseAccentColors, themeColors, type ColorScheme, type ColorTokens, type SunriseAccent } from '@/constants/theme';
import { NATIVE } from '@/hooks/useCalmLoop';

/** How long the old colours take to fade into the new (a change of theme). */
export const THEME_FADE_MS = 1000;

type ViewShot = typeof import('react-native-view-shot');
let viewShot: ViewShot | null | undefined;
/**
 * The screen-capture module, loaded on first use: it throws on import in a dev
 * client built before it was added, and then themes simply switch at once.
 */
function loadViewShot(): ViewShot | null {
  if (viewShot === undefined) {
    try {
      viewShot = require('react-native-view-shot') as ViewShot;
    } catch {
      viewShot = null;
    }
  }
  return viewShot;
}

/* ──────────────────── Types ──────────────────── */

/**
 * What the person picked in Profile → Appearance: always one of the themes.
 * There's no "follow the phone" option; until they pick, it's Night (a
 * stored "system" from before Sunrise replaced it falls back to Night too).
 */
export type AppearancePreference = ColorScheme;

/** The Appearance choices, in the order they're offered: through the day. */
export const APPEARANCE_OPTIONS: readonly AppearancePreference[] = ['sunrise', 'day', 'night'];

/**
 * How Home looks, both kept while the client decides (More → Appearance):
 * `sky`, the theme's own sun or moon alone (canvas "Home — appearance");
 * `classic`, the glowing mark in its ring. Both have the logo as the
 * appearance toggle. When one is chosen, delete the other and this setting.
 */
export type HomeStyle = 'sky' | 'classic';
export const HOME_STYLES: readonly HomeStyle[] = ['sky', 'classic'];

interface ThemeContextValue {
  /** The scheme actually in effect. */
  scheme: ColorScheme;
  isNight: boolean;
  colors: ColorTokens;
  preference: AppearancePreference;
  /**
   * Changes theme, fading the old colours into the new over THEME_FADE_MS where
   * the screen can be captured (native), at once otherwise. Resolves once the
   * new colours are in place under the fading picture.
   */
  setPreference: (next: AppearancePreference) => Promise<void>;
  homeStyle: HomeStyle;
  setHomeStyle: (next: HomeStyle) => void;
  /** Sunrise's accent while it's decided (constants/theme.ts SunriseAccent); crossfades like a theme change. */
  sunriseAccent: SunriseAccent;
  setSunriseAccent: (next: SunriseAccent) => Promise<void>;
}

/* ──────────────────── Context ──────────────────── */

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'houna-appearance';
const HOME_STYLE_KEY = 'houna-home-style';
const SUNRISE_ACCENT_KEY = 'houna-sunrise-accent';

function isPreference(v: unknown): v is AppearancePreference {
  return v === 'night' || v === 'day' || v === 'sunrise';
}

/* ──────────────────── Provider ──────────────────── */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>('night');
  const [homeStyle, setHomeStyleState] = useState<HomeStyle>('sky');
  const [sunriseAccent, setSunriseAccentState] = useState<SunriseAccent>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.multiGet([STORAGE_KEY, HOME_STYLE_KEY, SUNRISE_ACCENT_KEY])
      .then(([[, stored], [, style], [, accent]]) => {
        if (cancelled) return;
        if (isPreference(stored)) setPreferenceState(stored);
        if (style === 'sky' || style === 'classic') setHomeStyleState(style);
        if (SUNRISE_ACCENTS.includes(accent as SunriseAccent)) setSunriseAccentState(accent as SunriseAccent);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A change of colours crossfades: a picture of the screen goes up over everything, the
  // colours switch underneath it, and once they're drawn the picture fades away.
  const [veil, setVeil] = useState<{ uri: string; opacity: Animated.Value } | null>(null);
  /** The change waiting for the picture to be on screen, and who to tell once it's made. */
  const pending = useRef<{ apply: () => void; switched: () => void } | null>(null);
  const fading = useRef(false);
  /** Counts changes made under the picture, so the fade starts once each is drawn. */
  const [switches, setSwitches] = useState(0);

  const crossfade = useCallback((apply: () => void) => {
    const shot = Platform.OS === 'web' || fading.current ? null : loadViewShot();
    if (!shot) {
      apply();
      return Promise.resolve();
    }
    fading.current = true;
    return shot
      .captureScreen({ format: 'jpg', quality: 0.92, result: 'tmpfile' })
      .then(
        (uri) =>
          new Promise<void>((switched) => {
            pending.current = { apply, switched };
            setVeil({ uri, opacity: new Animated.Value(1) });
          }),
      )
      .catch(() => {
        fading.current = false;
        apply();
      });
  }, []);

  const setPreference = useCallback(
    (next: AppearancePreference) => {
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
        /* non-fatal — worst case the preference doesn't persist */
      });
      return crossfade(() => setPreferenceState(next));
    },
    [crossfade],
  );

  const setSunriseAccent = useCallback(
    (next: SunriseAccent) => {
      AsyncStorage.setItem(SUNRISE_ACCENT_KEY, next).catch(() => {});
      return crossfade(() => setSunriseAccentState(next));
    },
    [crossfade],
  );

  // The picture is loaded: give it a frame to be drawn, then change the colours under it.
  const onVeilLoad = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    requestAnimationFrame(() => {
      p.apply();
      setSwitches((n) => n + 1);
      p.switched();
    });
  }, []);

  // The new colours are committed: once they're drawn, fade the picture away.
  useEffect(() => {
    if (!veil || pending.current) return;
    const frame = requestAnimationFrame(() =>
      Animated.timing(veil.opacity, { toValue: 0, duration: THEME_FADE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }).start(() => {
        loadViewShot()?.releaseCapture(veil.uri);
        fading.current = false;
        setVeil(null);
      }),
    );
    return () => cancelAnimationFrame(frame);
    // Runs when the colours have changed under the picture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [switches]);

  const setHomeStyle = useCallback((next: HomeStyle) => {
    setHomeStyleState(next);
    AsyncStorage.setItem(HOME_STYLE_KEY, next).catch(() => {});
  }, []);

  const scheme: ColorScheme = preference;
  const tokens = scheme === 'sunrise' ? sunriseAccentColors[sunriseAccent] : themeColors[scheme];

  const value = useMemo<ThemeContextValue>(
    () => ({ scheme, isNight: scheme === 'night', colors: tokens, preference, setPreference, homeStyle, setHomeStyle, sunriseAccent, setSunriseAccent }),
    [scheme, tokens, preference, setPreference, homeStyle, setHomeStyle, sunriseAccent, setSunriseAccent],
  );

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {veil && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: veil.opacity }]}>
          <Animated.Image source={{ uri: veil.uri }} onLoad={onVeilLoad} fadeDuration={0} resizeMode="stretch" style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </ThemeContext.Provider>
  );
}

/* ──────────────────── Hook ──────────────────── */

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
