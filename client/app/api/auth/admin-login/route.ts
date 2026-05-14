import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/server/db';
import Admin from '@/lib/server/models/Admin';
import { verifyPassword } from '@/lib/server/hash';
import { setAuthCookie } from '@/lib/server/auth';
import { adminLoginSchema } from '@/lib/server/validators/auth.validator';
import { loginLimiter } from '@/lib/server/rateLimit';
import { writeAuditLog } from '@/lib/server/audit';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  try {
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = adminLoginSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { identifier, password } = result.data;

    if (!loginLimiter.check(ip)) {
      await writeAuditLog({ action: 'auth.login_failed', actorUsername: identifier, actorRole: 'admin', status: 'error', details: 'Rate limited' });
      return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const admin = await Admin.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    });
    if (!admin) {
      await writeAuditLog({ action: 'auth.login_failed', actorUsername: identifier, actorRole: 'admin', status: 'error', details: 'Account not found' });
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    if (!admin.isActive) {
      await writeAuditLog({ action: 'auth.login_failed', actorId: admin._id.toString(), actorUsername: admin.username, actorRole: 'admin', status: 'error', details: 'Account deactivated' });
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      await writeAuditLog({ action: 'auth.login_failed', actorId: admin._id.toString(), actorUsername: admin.username, actorRole: 'admin', status: 'error', details: 'Wrong password' });
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: admin._id.toString(), role: 'admin', username: admin.username },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as string } as jwt.SignOptions,
    );
    const res = NextResponse.json({ id: admin._id, username: admin.username, role: 'admin' });
    setAuthCookie(res, token);
    await writeAuditLog({ action: 'auth.login', actorId: admin._id.toString(), actorUsername: admin.username, actorRole: 'admin' });
    return res;
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
