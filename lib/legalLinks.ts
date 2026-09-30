import * as WebBrowser from 'expo-web-browser';

/**
 * Houna's privacy policy and terms of use: houna.org's own pages, so the website can update the
 * text without an app release (the store compliance pack drafts what they must say). Linked from
 * More, account settings and sign-up, as both stores require. Change the addresses here only:
 * every link reads them.
 */
export const PRIVACY_POLICY_URL = {
  en: 'https://houna.org/en/privacy-policy',
  ar: 'https://houna.org/ar/privacy-policy',
} as const;
export const TERMS_URL = { en: 'https://houna.org/en/terms-of-use', ar: 'https://houna.org/ar/terms-of-use' } as const;

/** Opens one in the in-app browser, in the reader's language. */
export function openLegal(which: 'privacy' | 'terms', language: 'en' | 'ar'): void {
  const url = (which === 'privacy' ? PRIVACY_POLICY_URL : TERMS_URL)[language];
  WebBrowser.openBrowserAsync(url).catch(() => {});
}
