import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * A gentle "your session is over" buzz for breathing and meditation, which
 * people often do with their eyes closed. Android: a soft double pulse
 * (wait, buzz, pause, buzz, in ms). iOS ignores vibration lengths, so it
 * gets the system success haptic instead. Web: nothing.
 */
export function sessionEndAlert() {
  if (Platform.OS === 'android') Vibration.vibrate([0, 220, 140, 220]);
  else if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
