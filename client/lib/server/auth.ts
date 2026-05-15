import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export interface AuthPayload {
  id: string;
  role: 'admin' | 'teacher' | 'warden';
  username: string;
  assignedBatches?: string[];
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
