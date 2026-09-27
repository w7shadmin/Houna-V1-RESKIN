import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The first breath (`app/welcome.tsx`) shows once, before anything is asked. Whether it's been
 * seen (finished or skipped) is kept on the phone alone.
 */
const FIRST_BREATH_KEY = 'houna-first-breath-done';

export async function firstBreathDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(FIRST_BREATH_KEY)) === '1';
  } catch {
    // Unreadable storage: never block the app on a welcome.
    return true;
  }
}

export function markFirstBreathDone(): Promise<void> {
  return AsyncStorage.setItem(FIRST_BREATH_KEY, '1').catch(() => {});
}
