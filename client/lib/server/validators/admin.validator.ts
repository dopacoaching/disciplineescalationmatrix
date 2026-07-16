import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format');

export const createAdminSchema = z.object({
  email:           z.string().email().max(200),
  fullName:        z.string().min(1, 'Name is required').max(100),
  username:        z.string().min(3).max(50),
  password:        z.string().min(8).max(128),
  isSuperAdmin:    z.boolean().optional().default(false),
  assignedBatches: z.array(objectId).optional().default([]),
});

export const updateAdminSchema = z.object({
  fullName:        z.string().min(1, 'Name is required').max(100).optional(),
  email:           z.string().email().max(200).optional(),
  username:        z.string().min(3).max(50).optional(),
  password:        z.string().min(8).max(128).optional(),
  isSuperAdmin:    z.boolean().optional(),
  assignedBatches: z.array(objectId).optional(),
  isActive:        z.boolean().optional(),
});
