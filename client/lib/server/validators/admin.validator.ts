import { z } from 'zod';

export const createAdminSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(8),
});

export const updateAdminSchema = z.object({
  isActive: z.boolean().optional(),
});
