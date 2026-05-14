export type EscalationLevel = 1 | 2 | 3;

export function escalationBadgeVariant(level: EscalationLevel): 'level1' | 'level2' | 'level3' {
  return `level${level}` as const;
}

export function escalationKey(level: EscalationLevel): string {
  return `escalation.level${level}`;
}

export function computePreviewLevel(totalAfter: number, hasHigh: boolean): EscalationLevel {
  if (hasHigh || totalAfter >= 3) return 3;
  if (totalAfter >= 2) return 2;
  return 1;
}
