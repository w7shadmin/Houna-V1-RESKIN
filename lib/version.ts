/**
 * Version numbers ("1.0.2"), compared part by part as numbers, so 1.0.10 is newer than 1.0.9.
 * Pure, for the minimum-version check (lib/remoteConfig.ts) and its tests.
 */

const parts = (v: string) => v.split('.').map((p) => parseInt(p, 10) || 0);

/** Negative if a is older than b, zero if the same, positive if newer. */
export function compareVersions(a: string, b: string): number {
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Whether `installed` is older than the oldest version still allowed. */
export function isBelowMinimum(installed: string | null | undefined, minimum: string | null | undefined): boolean {
  if (!installed || !minimum) return false;
  return compareVersions(installed, minimum) < 0;
}
