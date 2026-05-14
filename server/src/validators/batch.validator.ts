import { z } from 'zod';

export const createBatchSchema = z.object({
  name: z.string().min(1),
});

export const updateBatchSchema = z.object({
  name: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
});
