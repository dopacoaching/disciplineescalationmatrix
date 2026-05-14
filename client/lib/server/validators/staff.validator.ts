import { z } from 'zod';

export const createStaffSchema = z.object({
  fullName: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['teacher', 'warden']),
  assignedBatches: z.array(z.string()).optional(),
});

export const updateStaffSchema = z.object({
  fullName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['teacher', 'warden']).optional(),
  assignedBatches: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
