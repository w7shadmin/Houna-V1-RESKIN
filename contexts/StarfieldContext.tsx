import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

/**
 * The Houna starfield's handoff from Home: while it opens, Home's chrome and
 * the tab bar fade out together (`chrome` 1 → 0) so only the mark remains;
 * `chromeHidden` switches off their touches meanwhile.
 */
interface StarfieldState {
  chrome: Animated.Value;
  chromeHidden: boolean;
  setChromeHidden: (hidden: boolean) => void;
}

const StarfieldContext = createContext<StarfieldState | null>(null);

export function StarfieldProvider({ children }: { children: React.ReactNode }) {
  const chrome = useRef(new Animated.Value(1)).current;
  const [chromeHidden, setChromeHidden] = useState(false);
  const value = useMemo(() => ({ chrome, chromeHidden, setChromeHidden }), [chrome, chromeHidden]);
  return <StarfieldContext.Provider value={value}>{children}</StarfieldContext.Provider>;
}

/** Null outside the tabs (nothing to fade there). */
export function useStarfield() {
  return useContext(StarfieldContext);
}
