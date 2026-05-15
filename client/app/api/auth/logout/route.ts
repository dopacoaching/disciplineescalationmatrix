import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthUser } from '@/lib/server/auth';
import { connectDB } from '@/lib/server/db';
import { writeAuditLog } from '@/lib/server/audit';

export async function POST(): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const res = NextResponse.json({ message: 'Logged out' });
  clearAuthCookie(res);
  await connectDB();
  await writeAuditLog({ action: 'auth.logout', actorId: user.id, actorUsername: user.username, actorRole: user.role });
  return res;
}
