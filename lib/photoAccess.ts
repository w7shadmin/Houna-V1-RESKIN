import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Whether the photo library can be opened. iOS's picker runs outside the app and needs no
 * permission, so asking there would only show a pointless prompt (and a "no" would lock the
 * person out of a picker that works anyway). Android asks as before.
 */
export async function canPickPhotos(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return perm.granted;
}
