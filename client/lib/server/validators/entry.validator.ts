import { z } from 'zod';

export const REMARK_IDS = [
  'late_to_class', 'leaving_early', 'sleeping_in_room', 'bunking_class',
  'talking_in_class', 'causing_disturbance', 'timing_violation', 'curfew_violation',
  'misuse_devices', 'misuse_social_media', 'unauthorized_phone', 'exam_malpractice',
  'cheating', 'other',
] as const;

export const createEntrySchema = z.object({
  studentId: z.string().min(1),
  remarkId: z.enum(REMARK_IDS),
  customRemark: z.string().max(500).optional(),
});
