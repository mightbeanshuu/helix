/**
 * Hotspot = (normalised churn) * (normalised complexity). High score = bug
 * factory. Standard practice from Adam Tornhill's *Your Code as a Crime Scene*.
 */
export function hotspotScore(
  churn: number,
  complexity: number,
  maxChurn: number,
  maxComplexity: number,
): number {
  if (maxChurn === 0 || maxComplexity === 0) return 0;
  return (churn / maxChurn) * (complexity / maxComplexity);
}

export function annotateHotspots<T extends { churn: number; complexity: number }>(
  files: T[],
): (T & { hotspot: number })[] {
  const maxChurn = Math.max(1, ...files.map((f) => f.churn));
  const maxComplexity = Math.max(1, ...files.map((f) => f.complexity));
  return files.map((f) => ({
    ...f,
    hotspot: hotspotScore(f.churn, f.complexity, maxChurn, maxComplexity),
  }));
}
