import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/server/db';
import Staff from '@/lib/server/models/Staff';
import { verifyPassword } from '@/lib/server/hash';
import { setAuthCookie } from '@/lib/server/auth';
import { staffLoginSchema } from '@/lib/server/validators/auth.validator';
import { loginLimiter } from '@/lib/server/rateLimit';
import { writeAuditLog } from '@/lib/server/audit';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!loginLimiter.check(ip)) {
    return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }
  try {
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = staffLoginSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { username, password } = result.data;

    const staff = await Staff.findOne({ username: username.toLowerCase() });
    if (!staff) return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    if (!staff.isActive) return NextResponse.json({ message: 'Account deactivated' }, { status: 403 });

    const valid = await verifyPassword(password, staff.passwordHash);
    if (!valid) return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });

    const assignedBatches = staff.assignedBatches.map((id: mongoose.Types.ObjectId) => id.toString());
    const token = jwt.sign(
      { id: staff._id.toString(), role: staff.role, username: staff.username, assignedBatches },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as string } as jwt.SignOptions,
    );
    const res = NextResponse.json({
      id: staff._id, fullName: staff.fullName, username: staff.username,
      role: staff.role, assignedBatches,
    });
    setAuthCookie(res, token);
    await writeAuditLog({ action: 'auth.login', actorId: staff._id.toString(), actorUsername: staff.username, actorRole: staff.role });
    return res;
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
