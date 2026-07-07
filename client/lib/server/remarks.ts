export const PRESET_REMARKS = [
  { id: 'late_to_class',       severity: 'low',    label: 'Being late to class' },
  { id: 'leaving_early',       severity: 'low',    label: 'Leaving class early without permission' },
  { id: 'sleeping_in_room',    severity: 'medium', label: 'Sleeping in room during class hours' },
  { id: 'bunking_class',       severity: 'medium', label: 'Bunking class' },
  { id: 'talking_in_class',    severity: 'low',    label: 'Talking in class' },
  { id: 'causing_disturbance', severity: 'low',    label: 'Causing disturbance in class' },
  { id: 'timing_violation',    severity: 'medium', label: 'Timing violation' },
  { id: 'curfew_violation',    severity: 'medium', label: 'Curfew violation' },
  { id: 'misuse_devices',      severity: 'medium', label: 'Misuse of digital devices' },
  { id: 'misuse_social_media', severity: 'medium', label: 'Misuse of social media' },
  { id: 'unauthorized_phone',  severity: 'high',   label: 'Possession of unauthorized phone' },
  { id: 'exam_malpractice',    severity: 'high',   label: 'Exam malpractice' },
  { id: 'cheating',            severity: 'high',   label: 'Cheating' },
  { id: 'other',               severity: 'low',    label: 'Other' },
] as const;

export type RemarkId = typeof PRESET_REMARKS[number]['id'];
export type Severity = typeof PRESET_REMARKS[number]['severity'];

export function getRemarkById(id: string) {
  return PRESET_REMARKS.find(r => r.id === id);
}

// Human-readable label for a remark, preferring the admin's own free-text
// entry when the preset is "other".
export function remarkLabel(remarkId: string, customRemark?: string): string {
  if (remarkId === 'other' && customRemark?.trim()) return customRemark.trim();
  return getRemarkById(remarkId)?.label || remarkId;
}
