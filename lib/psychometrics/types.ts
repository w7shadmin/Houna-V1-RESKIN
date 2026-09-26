/**
 * Self-reflection test definitions (FEATURES_BRIEF §5). Tests are data, not
 * code: one JSON file per test under constants/psychometrics/, validated
 * against these types when registered.
 *
 * Only add tests whose licence permits app use, and use the instrument's
 * official Arabic translation where one exists — never machine-translate
 * validated items.
 */

export interface Localized {
  en: string;
  ar: string;
}

export interface TestTrait {
  key: string;
  label: Localized;
  description: Localized;
}

export interface TestItem {
  id: string;
  text: Localized;
  trait: string;
  /** Reverse-scored: an answer of `max` counts as `min`, and so on. */
  reverse: boolean;
}

export interface ScoreBand {
  /** Inclusive upper bound on the trait's mean score. The last band should cover `scale.max`. */
  max: number;
  label: Localized;
}

export interface TestDefinition {
  id: string;
  version: number;
  title: Localized;
  description: Localized;
  source: { citation: string; licence: string; url: string };
  /** Instruction shown above each statement, e.g. "How much do you agree?". */
  prompt?: Localized;
  scale: { min: number; max: number; labels: { en: string[]; ar: string[] } };
  traits: TestTrait[];
  items: TestItem[];
  scoring: { method: 'mean'; bands: ScoreBand[] };
  /**
   * Must stay false/absent. A test that screens for risk (e.g. self-harm
   * items) needs crisis resources surfaced on a concerning answer, which
   * isn't designed yet — the registry refuses such tests.
   */
  screensForRisk?: boolean;
  /** Development-only sample — never shown in production builds. */
  devOnly?: boolean;
}

/** item id → chosen scale value */
export type Answers = Record<string, number>;

export interface TraitScore {
  /** Mean of the trait's (reverse-corrected) answers, on the test's scale. */
  raw: number;
  /** `raw` mapped onto 0–1 across the scale. */
  normalised0to1: number;
  band: Localized;
}

export type TestScores = Record<string, TraitScore>;
