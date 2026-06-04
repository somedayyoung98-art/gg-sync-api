/**
 * Decide whether this request should run response validation (0–1 rate).
 */
export function shouldSampleValidation(rate: number): boolean {
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate;
}
