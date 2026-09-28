import type { Localized, TestDefinition } from '@/lib/psychometrics/types';
import { validateTest } from '@/lib/psychometrics/score';
import phq8 from './phq8.json';
import gad7 from './gad7.json';
import who5 from './who5.json';
import asrs5 from './asrs5.json';
import pcl5 from './pcl5.json';

/**
 * Registered self-reflection tests, in the order Discover lists them. Add a
 * test by dropping its JSON next to this file and listing it here — see
 * lib/psychometrics/types.ts for the rules (licence, official Arabic
 * translation, no risk screening yet). Phase one is short, free screeners
 * with Arabic versions; longer or restricted ones wait for phase two, with
 * professionals on board.
 */
const ALL: TestDefinition[] = [phq8, gad7, who5, asrs5, pcl5] as TestDefinition[];

function usable(def: TestDefinition): boolean {
  if ((def.devOnly || def.arabicPending) && !__DEV__) return false;
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

/** A test's text in the chosen language, falling back to English while its Arabic is pending. */
export function testText(text: Localized, language: 'en' | 'ar'): string {
  return text[language] || text.en;
}

/** The answer labels in the chosen language, falling back to English while the Arabic is pending. */
export function scaleLabels(def: TestDefinition, language: 'en' | 'ar'): string[] {
  const labels = def.scale.labels[language];
  return labels.every(Boolean) ? labels : def.scale.labels.en;
}
