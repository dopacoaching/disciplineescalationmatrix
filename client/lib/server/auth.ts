import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export interface AuthPayload {
  id: string;
  role: 'admin' | 'teacher' | 'warden';
  username: string;
  assignedBatches?: string[];
  // Only present for admins. Absent (undefined) is treated as a super admin so
  // pre-existing admin sessions/tokens keep full access without a migration.
  isSuperAdmin?: boolean;
}

/**
 * A super admin has unrestricted access to every batch and may manage other
 * admins. Any admin whose isSuperAdmin is not explicitly false is super — this
 * makes existing admins (created before this feature) super by default.
 */
export function isSuperAdmin(user: AuthPayload | null): boolean {
  return !!user && user.role === 'admin' && user.isSuperAdmin !== false;
}

/**
 * Batch restriction for an admin. Returns `null` for full (unrestricted) access
 * — i.e. super admins — and an array of allowed batch ObjectIds for a scoped
 * admin. Not meant for staff (their scoping is handled inline per-route).
 */
export function adminBatchScope(user: AuthPayload): mongoose.Types.ObjectId[] | null {
  if (isSuperAdmin(user)) return null;
  return (user.assignedBatches || []).map(id => new mongoose.Types.ObjectId(id));
}

/**
 * Whether an admin may act on a resource belonging to the given batch. Super
 * admins always can; scoped admins only within their assigned batches.
 */
export function adminCanAccessBatch(user: AuthPayload, batchId: string | mongoose.Types.ObjectId): boolean {
  const scope = adminBatchScope(user);
  if (scope === null) return true;
  return scope.some(id => id.toString() === batchId.toString());
}

export async function getAuthUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
  } catch {
    return null;
  }
}

function parseExpiryToSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 8 * 60 * 60;
  const val = parseInt(match[1], 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return val * (multipliers[match[2]] ?? 3600);
}

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseExpiryToSeconds(process.env.JWT_EXPIRES_IN || '8h'),
    path: '/',
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set('token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 0, path: '/' });
}
