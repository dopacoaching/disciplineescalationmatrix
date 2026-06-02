import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Normalize to lowercase first, THEN validate character set.
// This lets admins type "Teacher1" which becomes "teacher1" — matching how the
// server stores usernames (always lowercased). The previous plain .regex() check
// rejected any uppercase input and caused a 400 Bad Request.
const usernameField = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .transform(v => v.trim().toLowerCase())
  .refine(v => /^[a-z0-9._-]+$/.test(v), 'Username can only contain letters, numbers, dots, underscores, and hyphens');

export const createStaffSchema = z.object({
  fullName:        z.string().min(1).max(100),
  username:        usernameField,
  password:        z.string().min(8).max(128),
  role:            z.enum(['teacher', 'warden']),
  assignedBatches: z.array(objectId).optional(),
});

export const updateStaffSchema = z.object({
  fullName:        z.string().min(1).max(100).optional(),
  username:        usernameField.optional(),
  password:        z.string().min(8).max(128).optional(),
  role:            z.enum(['teacher', 'warden']).optional(),
  assignedBatches: z.array(objectId).optional(),
  isActive:        z.boolean().optional(),
});
