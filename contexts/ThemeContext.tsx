import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  schemeFromSystem,
  themeColors,
  type ColorScheme,
  type ColorTokens,
} from '@/constants/theme';

/* ──────────────────── Types ──────────────────── */

/** What the person picked in Profile → Appearance. */
export type AppearancePreference = 'system' | 'night' | 'day';

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
  return v === 'system' || v === 'night' || v === 'day';
}

/* ──────────────────── Provider ──────────────────── */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
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

  const scheme: ColorScheme = preference === 'system' ? schemeFromSystem(system) : preference;
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
