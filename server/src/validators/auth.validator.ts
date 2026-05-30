import { z } from 'zod';

export const adminLoginSchema = z.object({
  identifier: z.string().min(1).max(200),
  password:   z.string().min(1).max(128),
});

export const staffLoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128),
});
