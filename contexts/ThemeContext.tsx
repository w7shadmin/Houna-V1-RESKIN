import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeColors, type ColorScheme, type ColorTokens } from '@/constants/theme';

/* ──────────────────── Types ──────────────────── */

/**
 * What the person picked in Profile → Appearance: always one of the themes.
 * There's no "follow the phone" option; until they pick, it's Night (a
 * stored "system" from before Sunrise replaced it falls back to Night too).
 */
export type AppearancePreference = ColorScheme;

/** The Appearance choices, in the order they're offered: through the day. */
export const APPEARANCE_OPTIONS: readonly AppearancePreference[] = ['sunrise', 'day', 'night'];

interface ThemeContextValue {
  /** The scheme actually in effect. */
  scheme: ColorScheme;
  isNight: boolean;
  colors: ColorTokens;
  preference: AppearancePreference;
  setPreference: (next: AppearancePreference) => void;
}

/* ──────────────────── Context ──────────────────── */

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'houna-appearance';

function isPreference(v: unknown): v is AppearancePreference {
  return v === 'night' || v === 'day' || v === 'sunrise';
}

/* ──────────────────── Provider ──────────────────── */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>('night');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && isPreference(stored)) setPreferenceState(stored);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* non-fatal — worst case the preference doesn't persist */
    });
  }, []);

  const scheme: ColorScheme = preference;
  const tokens = themeColors[scheme];

  const value = useMemo<ThemeContextValue>(
    () => ({ scheme, isNight: scheme === 'night', colors: tokens, preference, setPreference }),
    [scheme, tokens, preference, setPreference],
  );

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
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
