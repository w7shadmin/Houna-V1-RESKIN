import * as WebBrowser from 'expo-web-browser';

/**
 * Houna's privacy policy and terms of use, on houna.org (drafted in the store compliance pack;
 * the website publishes them). Linked from More, account settings and sign-up, as both stores
 * require. Change the addresses here only: every link reads them.
 */
export const PRIVACY_POLICY_URL = { en: 'https://houna.org/privacy', ar: 'https://houna.org/ar/privacy' } as const;
export const TERMS_URL = { en: 'https://houna.org/terms', ar: 'https://houna.org/ar/terms' } as const;

/** Opens one in the in-app browser, in the reader's language. */
export function openLegal(which: 'privacy' | 'terms', language: 'en' | 'ar'): void {
  const url = (which === 'privacy' ? PRIVACY_POLICY_URL : TERMS_URL)[language];
  WebBrowser.openBrowserAsync(url).catch(() => {});
}
