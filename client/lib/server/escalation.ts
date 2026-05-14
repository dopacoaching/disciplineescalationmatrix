export function computeEscalationLevel(totalEntries: number, hasHighSeverity: boolean): 1 | 2 | 3 {
  if (hasHighSeverity || totalEntries >= 3) return 3;
  if (totalEntries >= 2) return 2;
  return 1;
}
