import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';
import { safeUrl } from './hounaApi';

/**
 * Opens an article, a podcast page or a link from the directory inside the app (the system's
 * in-app browser: Safari View Controller on iPhone, Custom Tabs on Android), so reading or
 * listening doesn't send people away from Houna. Only http(s) links (`safeUrl`); anything else, or
 * a failure, falls back to the system. The web preview just opens a new tab.
 */
export function openInApp(url: string | null | undefined, toolbarColor?: string): void {
  const link = safeUrl(url ?? null);
  if (!link) return;
  if (Platform.OS === 'web' || !/^https?:\/\//i.test(link)) {
    Linking.openURL(link).catch(() => {});
    return;
  }
  WebBrowser.openBrowserAsync(link, {
    toolbarColor,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    enableBarCollapsing: true,
  }).catch(() => Linking.openURL(link).catch(() => {}));
}
