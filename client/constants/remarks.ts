export const PRESET_REMARKS = [
  { id: 'late_to_class',       severity: 'low'    as const },
  { id: 'leaving_early',       severity: 'low'    as const },
  { id: 'sleeping_in_room',    severity: 'medium' as const },
  { id: 'bunking_class',       severity: 'medium' as const },
  { id: 'talking_in_class',    severity: 'low'    as const },
  { id: 'causing_disturbance', severity: 'low'    as const },
  { id: 'timing_violation',    severity: 'medium' as const },
  { id: 'curfew_violation',    severity: 'medium' as const },
  { id: 'misuse_devices',      severity: 'medium' as const },
  { id: 'misuse_social_media', severity: 'medium' as const },
  { id: 'unauthorized_phone',  severity: 'high'   as const },
  { id: 'exam_malpractice',    severity: 'high'   as const },
  { id: 'cheating',            severity: 'high'   as const },
  { id: 'other',               severity: 'low'    as const },
] as const;

export type RemarkId = typeof PRESET_REMARKS[number]['id'];
export type Severity = 'low' | 'medium' | 'high';

export const HIGH_SEVERITY_IDS: RemarkId[] = ['unauthorized_phone', 'exam_malpractice', 'cheating'];
