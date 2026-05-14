import { z } from 'zod';

export const adminLoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const staffLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
