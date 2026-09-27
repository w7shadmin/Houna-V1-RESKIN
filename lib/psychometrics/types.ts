/**
 * Self-reflection test definitions (FEATURES_BRIEF §5). Tests are data, not
 * code: one JSON file per test under constants/psychometrics/, validated
 * against these types when registered.
 *
 * Only add tests whose licence permits app use, and use the instrument's
 * official Arabic translation where one exists — never machine-translate
 * validated items. A test whose Arabic isn't in yet says so (`arabicPending`)
 * and is kept out of release builds until it is.
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
  /** `count` scoring: the answer at or above which this item counts (e.g. ASRS's shaded boxes). */
  threshold?: number;
}

export interface ScoreBand {
  /**
   * Inclusive upper bound on the trait's score: its mean (`mean`), total
   * (`sum`, after any multiplier) or count (`count`). The highest band must
   * cover the top of that range.
   */
  max: number;
  label: Localized;
  /** What this result means, shown with it (in place of the trait's description). */
  description?: Localized;
  /** A result worth support: the results screen puts talking to someone first. */
  concern?: boolean;
}

export interface TestDefinition {
  id: string;
  version: number;
  title: Localized;
  description: Localized;
  source: { citation: string; licence: string; url: string };
  /** Instruction shown above each statement, e.g. "How much do you agree?". */
  prompt?: Localized;
  /** Shown on the intro before starting: the instrument's own instructions, or a gentle heads-up. */
  instructions?: Localized;
  scale: { min: number; max: number; labels: { en: string[]; ar: string[] } };
  traits: TestTrait[];
  items: TestItem[];
  /**
   * `mean`: each trait's average answer. `sum`: its total (times `multiplier`,
   * e.g. WHO-5's ×4 to a percentage). `count`: how many of its items reached
   * their `threshold`. Clinical screeners are `sum` or `count`, with their
   * published cut-offs as bands.
   */
  scoring: { method: 'mean' | 'sum' | 'count'; bands: ScoreBand[]; multiplier?: number };
  /**
   * Must stay false/absent. A test that screens for risk (e.g. self-harm
   * items) needs crisis resources surfaced on a concerning answer, which
   * isn't designed yet — the registry refuses such tests.
   */
  screensForRisk?: boolean;
  /** Development-only sample — never shown in production builds. */
  devOnly?: boolean;
  /**
   * The official Arabic isn't in yet (its `ar` texts are empty and English
   * shows instead): development builds only, like `devOnly`.
   */
  arabicPending?: boolean;
}

/** item id → chosen scale value */
export type Answers = Record<string, number>;

export interface TraitScore {
  /** The trait's score: its mean, total or count, per `scoring.method`. */
  raw: number;
  /** The top of `raw`'s range (`sum` and `count`), for "12 of 24"; absent for `mean`. */
  max?: number;
  /** `raw` mapped onto 0–1 across its range. */
  normalised0to1: number;
  band: Localized;
  bandDescription?: Localized;
  concern?: boolean;
}

export type TestScores = Record<string, TraitScore>;
