import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * This install's anonymous id for the community map (`activity_pings.actor`): made on the phone
 * the first time it's needed, kept there, never sent with the account or anything that names the
 * person. The map counts each id once, in its latest country (migration 20260930100000).
 */
const ACTOR_KEY = 'houna-activity-actor';
let actor: Promise<string | null> | null = null;

export function activityActor(): Promise<string | null> {
  actor ??= AsyncStorage.getItem(ACTOR_KEY)
    .then(async (saved) => {
      if (saved) return saved;
      const fresh = Crypto.randomUUID();
      await AsyncStorage.setItem(ACTOR_KEY, fresh);
      return fresh;
    })
    .catch(() => null);
  return actor;
}
