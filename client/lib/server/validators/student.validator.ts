import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createStudentSchema = z.object({
  registerNumber: z.string().min(1).max(50),
  fullName:       z.string().min(1).max(100),
  batchId:        objectId,
});

export const updateStudentSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  batchId:  objectId.optional(),
});
