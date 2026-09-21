import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { strings, type Language, type StringCatalogue } from '@/constants/strings';
import { latinFontFamily, arabicFontFamily, type FontFamily } from '@/constants/theme';

/* ──────────────────── Types ──────────────────── */

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: StringCatalogue;
  /** Inter for English, Scheherazade New for Arabic — resolved per current language. */
  fonts: FontFamily;
}

/* ──────────────────── Context ──────────────────── */

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = 'houna-language';

function isRTLFor(lang: Language) {
  return lang === 'ar';
}

function detectInitialLanguage(): Language {
  const deviceLang = Localization.getLocales()[0]?.languageCode;
  return deviceLang === 'ar' ? 'ar' : 'en';
}

/* ──────────────────── Provider ──────────────────── */

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  /* Load persisted preference (falls back to device locale) once on mount. */
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        const next: Language =
          stored === 'en' || stored === 'ar' ? stored : detectInitialLanguage();
        setLanguageState(next);

        /* Align the native layout direction with the resolved language.
           On first app boot I18nManager already reflects the last forced
           value (or LTR default), so this only matters if it drifted —
           e.g. the persisted preference differs from what RN booted with. */
        if (I18nManager.isRTL !== isRTLFor(next)) {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(isRTLFor(next));
          // A reload is required for the native layout direction to
          // actually flip. We don't force one here on cold boot — the
          // mismatch only happens after a manual language change anyway,
          // which does reload (see setLanguage below).
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* non-fatal — worst case the preference doesn't persist */
    });

    const nextIsRTL = isRTLFor(next);
    if (I18nManager.isRTL === nextIsRTL) return;

    I18nManager.allowRTL(true);
    I18nManager.forceRTL(nextIsRTL);

    if (Platform.OS === 'web') return; // RN Web re-renders without a reload

    // RTL only takes effect after a native reload. expo-updates works in
    // dev builds and standalone binaries; it's unavailable in Expo Go, so
    // we swallow that case rather than crash — the user can still restart
    // the app manually and the new direction will be there.
    import('expo-updates')
      .then((Updates) => Updates.reloadAsync())
      .catch(() => {
        console.warn(
          'Restart the app to apply the new text direction (expo-updates reload unavailable in this environment).',
        );
      });
  }, []);

  const isRTL = isRTLFor(language);

  /*
   * Web only. `I18nManager.forceRTL()` flips RN's own internal layout
   * resolution (Yoga), which is all native needs — but on web nothing sets
   * the actual `dir` attribute on the document, so the browser keeps
   * resolving `flexDirection: 'row'` and `direction` as LTR regardless.
   * Result: Arabic text renders correctly (each Text re-computes its own
   * alignment), but row children never visually reorder. Native is
   * unaffected by this — it doesn't use the DOM at all.
   */
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    }
  }, [isRTL]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      isRTL,
      t: strings[language],
      fonts: isRTL ? arabicFontFamily : latinFontFamily,
    }),
    [language, setLanguage, isRTL],
  );

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/* ──────────────────── Hook ──────────────────── */

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a <LanguageProvider>');
  }
  return ctx;
}
