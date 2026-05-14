export const PRESET_REMARKS = [
  { id: 'late_to_class',       severity: 'low'    },
  { id: 'leaving_early',       severity: 'low'    },
  { id: 'sleeping_in_room',    severity: 'medium' },
  { id: 'bunking_class',       severity: 'medium' },
  { id: 'talking_in_class',    severity: 'low'    },
  { id: 'causing_disturbance', severity: 'low'    },
  { id: 'timing_violation',    severity: 'medium' },
  { id: 'curfew_violation',    severity: 'medium' },
  { id: 'misuse_devices',      severity: 'medium' },
  { id: 'misuse_social_media', severity: 'medium' },
  { id: 'unauthorized_phone',  severity: 'high'   },
  { id: 'exam_malpractice',    severity: 'high'   },
  { id: 'cheating',            severity: 'high'   },
  { id: 'other',               severity: 'low'    },
] as const;

export type RemarkId = typeof PRESET_REMARKS[number]['id'];
export type Severity = typeof PRESET_REMARKS[number]['severity'];

export function getRemarkById(id: string) {
  return PRESET_REMARKS.find(r => r.id === id);
}
