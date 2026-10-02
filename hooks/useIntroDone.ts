import { createContext, useContext } from 'react';

/**
 * False while the animated splash is still over the app (app/_layout.tsx), so a screen that
 * tells a story from its first second (the first breath) can wait for it to lift.
 */
export const IntroDoneContext = createContext(true);

export function useIntroDone() {
  return useContext(IntroDoneContext);
}
