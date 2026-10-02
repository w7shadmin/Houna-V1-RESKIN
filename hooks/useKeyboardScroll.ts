import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, type LayoutChangeEvent, type ScrollView } from 'react-native';

/**
 * Keeps a text field visible when the keyboard opens inside a ScrollView.
 * `KeyboardSafeView` shrinks the scroll area; this then scrolls so the
 * field (or the end of the content) sits above the keyboard.
 *
 * Spread `scrollProps` on the ScrollView and `inputProps` on the TextInput.
 * `target`: 'end' scrolls to the bottom (a note field near the end of a
 * sheet); a function gets the visible scroll height and returns the y to
 * scroll to. Call `reveal` again when a growing field changes size.
 */
export function useKeyboardScroll(target: 'end' | ((visibleHeight: number) => number)) {
  const scrollRef = useRef<ScrollView>(null);
  const focused = useRef(false);
  const visibleHeight = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  const reveal = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll || !focused.current) return;
    const t = targetRef.current;
    if (t === 'end') scroll.scrollToEnd({ animated: true });
    else scroll.scrollTo({ y: Math.max(0, t(visibleHeight.current)), animated: true });
  }, []);

  // The scroll area shrinks once the keyboard padding lands — reveal then,
  // and again on keyboardDidShow in case the layout didn't change.
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      const shrank = h < visibleHeight.current;
      visibleHeight.current = h;
      if (shrank) reveal();
    },
    [reveal],
  );

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => setTimeout(reveal, 80));
    return () => sub.remove();
  }, [reveal]);

  return {
    scrollRef,
    reveal,
    scrollProps: { onLayout },
    inputProps: {
      onFocus: () => {
        focused.current = true;
        // Already-open keyboard (moving between fields): no show event fires.
        if (Keyboard.isVisible?.()) setTimeout(reveal, 80);
      },
      onBlur: () => {
        focused.current = false;
      },
    },
  };
}
