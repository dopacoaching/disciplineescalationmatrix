import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const usernameRe = /^[a-z0-9._-]+$/;

export const createStaffSchema = z.object({
  fullName:        z.string().min(1).max(100),
  username:        z.string().min(3).max(50).regex(usernameRe, 'Only lowercase alphanumeric, dots, underscores, hyphens'),
  password:        z.string().min(8).max(128),
  role:            z.enum(['teacher', 'warden']),
  assignedBatches: z.array(objectId).optional(),
});

export const updateStaffSchema = z.object({
  fullName:        z.string().min(1).max(100).optional(),
  username:        z.string().min(3).max(50).regex(usernameRe, 'Only lowercase alphanumeric, dots, underscores, hyphens').optional(),
  password:        z.string().min(8).max(128).optional(),
  role:            z.enum(['teacher', 'warden']).optional(),
  assignedBatches: z.array(objectId).optional(),
  isActive:        z.boolean().optional(),
});
