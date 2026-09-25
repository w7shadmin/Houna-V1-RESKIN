import type { TestDefinition } from '@/lib/psychometrics/types';
import { validateTest } from '@/lib/psychometrics/score';
import devSample from './dev-sample.json';

/**
 * Registered self-reflection tests. Add a test by dropping its JSON next to
 * this file and listing it here — see lib/psychometrics/types.ts for the
 * rules (licence, official Arabic translation, no risk screening yet).
 */
const ALL: TestDefinition[] = [devSample as TestDefinition];

function usable(def: TestDefinition): boolean {
  if (def.devOnly && !__DEV__) return false;
  const problems = validateTest(def);
  if (problems.length > 0) {
    // Loud in development, silently skipped in production.
    if (__DEV__) throw new Error(`Invalid test "${def.id}": ${problems.join('; ')}`);
    return false;
  }
  return true;
}

export const TESTS: TestDefinition[] = ALL.filter(usable);

export function getTest(id: string): TestDefinition | undefined {
  return TESTS.find((t) => t.id === id);
}
