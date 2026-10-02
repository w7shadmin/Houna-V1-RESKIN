import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import aesjs from 'aes-js';
import { Platform } from 'react-native';

/**
 * Where Supabase keeps the signed-in session on the phone: encrypted, instead of as plain text in
 * the app's storage. The session is too large for the phone's secure store (Keychain on iOS,
 * Keystore on Android: about 2 KB), so the session itself stays in AsyncStorage, encrypted with
 * AES-256, and only its key goes into the secure store; a fresh key on every write. Supabase's own
 * recommended pattern for React Native.
 *
 * - A session saved before this (plain text, no key) is still read once, then saved encrypted, so
 *   nobody is signed out by the update.
 * - A key the secure store has lost (say, a backup restored to a new phone) just means signing in
 *   again.
 * - The web and a dev client built before expo-secure-store keep the old plain storage: its import
 *   throws when the native side is missing, so it's loaded lazily.
 */

type SecureStoreModule = typeof import('expo-secure-store');

let secureStore: SecureStoreModule | null | undefined;
function getSecureStore(): SecureStoreModule | null {
  if (secureStore !== undefined) return secureStore;
  if (Platform.OS === 'web') return (secureStore = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    secureStore = require('expo-secure-store') as SecureStoreModule;
  } catch {
    secureStore = null;
  }
  return secureStore;
}

/** The secure store only takes letters, digits, `.`, `-` and `_` in a key. */
const keyName = (key: string) => `houna-enc.${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;

function encrypt(value: string, key: Uint8Array): string {
  const cipher = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(1));
  return aesjs.utils.hex.fromBytes(cipher.encrypt(aesjs.utils.utf8.toBytes(value)));
}

function decrypt(hex: string, key: Uint8Array): string {
  const cipher = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(1));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(hex)));
}

async function setItem(key: string, value: string): Promise<void> {
  const store = getSecureStore();
  if (!store) return AsyncStorage.setItem(key, value);
  const aesKey = Crypto.getRandomBytes(32);
  const encrypted = encrypt(value, aesKey);
  await store.setItemAsync(keyName(key), aesjs.utils.hex.fromBytes(aesKey));
  await AsyncStorage.setItem(key, encrypted);
}

async function getItem(key: string): Promise<string | null> {
  const store = getSecureStore();
  const stored = await AsyncStorage.getItem(key);
  if (!store || stored == null) return stored;

  const hexKey = await store.getItemAsync(keyName(key));
  if (!hexKey) {
    // Saved before encryption: plain JSON. Keep it, encrypted from now on.
    if (stored.startsWith('{') || stored.startsWith('[') || stored.startsWith('"')) {
      await setItem(key, stored).catch(() => {});
      return stored;
    }
    return null;
  }
  try {
    return decrypt(stored, aesjs.utils.hex.toBytes(hexKey));
  } catch {
    return null;
  }
}

async function removeItem(key: string): Promise<void> {
  const store = getSecureStore();
  await AsyncStorage.removeItem(key);
  if (store) await store.deleteItemAsync(keyName(key)).catch(() => {});
}

export const secureSessionStorage = { getItem, setItem, removeItem };
