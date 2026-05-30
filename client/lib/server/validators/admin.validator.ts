import { z } from 'zod';

export const createAdminSchema = z.object({
  email:    z.string().email().max(200),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
});

export const updateAdminSchema = z.object({
  isActive: z.boolean().optional(),
});
