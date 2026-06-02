import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthUser } from '@/lib/server/auth';
import { connectDB } from '@/lib/server/db';
import { writeAuditLog } from '@/lib/server/audit';

export async function POST(): Promise<NextResponse> {
  // Clear the auth cookie unconditionally first — logout must succeed even if
  // the DB is unavailable. If clearAuthCookie() were called after connectDB(),
  // a DB failure would return 500 and the browser cookie would not be cleared,
  // leaving the user stuck in a logged-in state.
  const res = NextResponse.json({ message: 'Logged out' });
  clearAuthCookie(res);

  try {
    const user = await getAuthUser();
    if (user) {
      await connectDB();
      await writeAuditLog({ action: 'auth.logout', actorId: user.id, actorUsername: user.username, actorRole: user.role });
    }
  } catch {
    // Audit failure must never prevent logout from completing
  }

  return res;
}
