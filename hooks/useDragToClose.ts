import { useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';
import { NATIVE } from '@/hooks/useCalmLoop';

/** How far down, or how fast, a release has to be to close. */
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 0.9;

/**
 * Drag down to close (the Tanafas hub, the mood check-in): `drag` follows the finger down (and
 * gives a little, then holds, if pulled up), springs back if let go early, and calls `onClose`
 * past the distance or on a quick flick. Only a downward, mostly vertical move claims the touch,
 * so taps, sliders and sideways swipes underneath keep working. Put `panHandlers` on the part
 * that drags and add `drag` to its translateY. Core PanResponder: no native module needed.
 */
export function useDragToClose(onClose: () => void, enabled = true) {
  const drag = useRef(new Animated.Value(0)).current;
  const live = useRef({ onClose, enabled });
  live.current = { onClose, enabled };

  const responder = useMemo(() => {
    const settle = () => Animated.spring(drag, { toValue: 0, useNativeDriver: NATIVE, bounciness: 4, speed: 14 }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => live.current.enabled && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_, g) => drag.setValue(g.dy >= 0 ? g.dy : Math.max(-16, g.dy * 0.25)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) live.current.onClose();
        else settle();
      },
      onPanResponderTerminate: settle,
    });
  }, [drag]);

  return { drag, panHandlers: responder.panHandlers };
}
