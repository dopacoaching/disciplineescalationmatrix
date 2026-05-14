import { z } from 'zod';

export const createStudentSchema = z.object({
  registerNumber: z.string().min(1),
  fullName: z.string().min(1),
  batchId: z.string().min(1),
});

export const updateStudentSchema = z.object({
  fullName: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(),
});
