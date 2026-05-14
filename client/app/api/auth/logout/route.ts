import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthUser } from '@/lib/server/auth';

export async function POST(): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const res = NextResponse.json({ message: 'Logged out' });
  clearAuthCookie(res);
  return res;
}
