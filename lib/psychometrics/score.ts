import type { Answers, TestDefinition, TestScores } from './types';

/**
 * Pure scoring: per trait, the mean of its answered items (reverse-scored
 * items flipped across the scale), normalised to 0–1 and placed in the
 * first band whose `max` it doesn't exceed. Unanswered items are skipped;
 * a trait with no answers is left out of the result rather than guessed.
 *
 * No imports beyond types, so it runs under `node --test` without a bundler.
 */
export function scoreTest(def: TestDefinition, answers: Answers): TestScores {
  const { min, max } = def.scale;
  const sums = new Map<string, { total: number; n: number }>();

  for (const item of def.items) {
    const answer = answers[item.id];
    if (answer === undefined) continue;
    if (!Number.isFinite(answer) || answer < min || answer > max) {
      throw new RangeError(`Answer ${answer} for ${item.id} is outside ${min}–${max}`);
    }
    const value = item.reverse ? min + max - answer : answer;
    const s = sums.get(item.trait) ?? { total: 0, n: 0 };
    s.total += value;
    s.n += 1;
    sums.set(item.trait, s);
  }

  const bands = [...def.scoring.bands].sort((a, b) => a.max - b.max);
  const scores: TestScores = {};
  for (const trait of def.traits) {
    const s = sums.get(trait.key);
    if (!s) continue;
    const raw = s.total / s.n;
    const band = bands.find((b) => raw <= b.max) ?? bands[bands.length - 1];
    scores[trait.key] = {
      raw,
      normalised0to1: max === min ? 0 : (raw - min) / (max - min),
      band: band.label,
    };
  }
  return scores;
}

/** Structural checks run when a test is registered. Returns problems; empty means valid. */
export function validateTest(def: TestDefinition): string[] {
  const problems: string[] = [];
  const traitKeys = new Set(def.traits.map((t) => t.key));
  const span = def.scale.max - def.scale.min + 1;

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
    if (!item.text.en || !item.text.ar) problems.push(`item ${item.id} needs text in both languages`);
  }
  if (def.scoring.bands.length === 0) problems.push('no score bands');
  else if (Math.max(...def.scoring.bands.map((b) => b.max)) < def.scale.max) {
    problems.push('score bands must cover the top of the scale');
  }
  return problems;
}
