import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Username accepts any characters — letters, numbers, symbols, spaces, etc.
// The server lowercases it before saving so logins are case-insensitive.
const usernameField = z.string()
  .min(1, 'Username is required')
  .max(50, 'Username must be at most 50 characters')
  .transform(v => v.toLowerCase());

// Password may be any non-empty string — staff can choose anything they like;
// no symbol/number/length complexity rules. 128 cap is just a sanity bound.
export const createStaffSchema = z.object({
  fullName:         z.string().min(1).max(100),
  username:         usernameField,
  password:         z.string().min(1).max(128),
  role:             z.enum(['teacher', 'warden']),
  assignedBatches:  z.array(objectId).optional(),
  isCampusIncharge: z.boolean().optional(),
});

export const updateStaffSchema = z.object({
  fullName:         z.string().min(1).max(100).optional(),
  username:         usernameField.optional(),
  password:         z.string().min(1).max(128).optional(),
  role:             z.enum(['teacher', 'warden']).optional(),
  assignedBatches:  z.array(objectId).optional(),
  isActive:         z.boolean().optional(),
  isCampusIncharge: z.boolean().optional(),
});
