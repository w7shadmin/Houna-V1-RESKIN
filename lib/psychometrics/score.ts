import type { Answers, TestDefinition, TestScores } from './types';

/**
 * Pure scoring, per trait, by the test's `scoring.method`:
 * - `mean`: the average of its answered items (reverse-scored items flipped
 *   across the scale), on the scale;
 * - `sum`: their total, times `multiplier` if the test has one (WHO-5's ×4);
 * - `count`: how many of them reached their item's `threshold` (ASRS).
 * The score is placed in the first band whose `max` it doesn't exceed, and
 * normalised to 0–1 across its range. Unanswered items are skipped; a trait
 * with no answers is left out of the result rather than guessed.
 *
 * No imports beyond types, so it runs under `node --test` without a bundler.
 */
export function scoreTest(def: TestDefinition, answers: Answers): TestScores {
  const { min, max } = def.scale;
  const { method, multiplier = 1 } = def.scoring;
  const sums = new Map<string, { total: number; counted: number; n: number }>();

  for (const item of def.items) {
    const answer = answers[item.id];
    if (answer === undefined) continue;
    if (!Number.isFinite(answer) || answer < min || answer > max) {
      throw new RangeError(`Answer ${answer} for ${item.id} is outside ${min}–${max}`);
    }
    const value = item.reverse ? min + max - answer : answer;
    const s = sums.get(item.trait) ?? { total: 0, counted: 0, n: 0 };
    s.total += value;
    if (item.threshold !== undefined && value >= item.threshold) s.counted += 1;
    s.n += 1;
    sums.set(item.trait, s);
  }

  const bands = [...def.scoring.bands].sort((a, b) => a.max - b.max);
  const scores: TestScores = {};
  for (const trait of def.traits) {
    const s = sums.get(trait.key);
    if (!s) continue;
    const size = def.items.filter((i) => i.trait === trait.key).length;
    let raw: number;
    let lo: number;
    let hi: number;
    if (method === 'sum') {
      raw = s.total * multiplier;
      lo = size * min * multiplier;
      hi = size * max * multiplier;
    } else if (method === 'count') {
      raw = s.counted;
      lo = 0;
      hi = size;
    } else {
      raw = s.total / s.n;
      lo = min;
      hi = max;
    }
    const band = bands.find((b) => raw <= b.max) ?? bands[bands.length - 1];
    scores[trait.key] = {
      raw,
      ...(method === 'mean' ? {} : { max: hi }),
      normalised0to1: hi === lo ? 0 : (raw - lo) / (hi - lo),
      band: band.label,
      ...(band.description ? { bandDescription: band.description } : {}),
      ...(band.concern ? { concern: true } : {}),
    };
  }
  return scores;
}

/** The top of a trait's score range, per the scoring method. */
function rangeTop(def: TestDefinition, trait: string): number {
  const size = def.items.filter((i) => i.trait === trait).length;
  if (def.scoring.method === 'sum') return size * def.scale.max * (def.scoring.multiplier ?? 1);
  if (def.scoring.method === 'count') return size;
  return def.scale.max;
}

/** Structural checks run when a test is registered. Returns problems; empty means valid. */
export function validateTest(def: TestDefinition): string[] {
  const problems: string[] = [];
  const traitKeys = new Set(def.traits.map((t) => t.key));
  const span = def.scale.max - def.scale.min + 1;
  const arabicOk = (s: string) => !!s || !!def.arabicPending;

  if (def.screensForRisk) problems.push('risk-screening tests need crisis handling before they can be added');
  if (def.scale.max <= def.scale.min) problems.push('scale.max must be greater than scale.min');
  if (def.scale.labels.en.length !== span || def.scale.labels.ar.length !== span) {
    problems.push(`scale needs ${span} labels in each language`);
  }
  if (def.items.length === 0) problems.push('no items');
  const ids = new Set<string>();
  for (const item of def.items) {
    if (ids.has(item.id)) problems.push(`duplicate item id ${item.id}`);
    ids.add(item.id);
    if (!traitKeys.has(item.trait)) problems.push(`item ${item.id} has unknown trait ${item.trait}`);
    if (!item.text.en || !arabicOk(item.text.ar)) problems.push(`item ${item.id} needs text in both languages`);
    if (def.scoring.method === 'count') {
      if (item.threshold === undefined) problems.push(`item ${item.id} needs a threshold to be counted`);
      else if (item.threshold < def.scale.min || item.threshold > def.scale.max) problems.push(`item ${item.id}'s threshold is off the scale`);
    }
  }
  if (def.scoring.bands.length === 0) problems.push('no score bands');
  else {
    const top = Math.max(...def.scoring.bands.map((b) => b.max));
    for (const trait of def.traits) {
      if (top < rangeTop(def, trait.key)) problems.push('score bands must cover the top of the range');
    }
  }
  return problems;
}
