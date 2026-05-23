import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isDuplicateKeyError } from '@/lib/server/db';
import Admin from '@/lib/server/models/Admin';
import { getAuthUser } from '@/lib/server/auth';
import { hashPassword } from '@/lib/server/hash';
import { createAdminSchema } from '@/lib/server/validators/admin.validator';
import { writeAuditLog } from '@/lib/server/audit';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    await connectDB();
    const admins = await Admin.find().select('-passwordHash').sort({ createdAt: -1 });
    return NextResponse.json(admins);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = createAdminSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { email, username, password } = result.data;
    const passwordHash = await hashPassword(password);
    const admin = await Admin.create({
      email: email.toLowerCase(), username: username.toLowerCase(), passwordHash, createdBy: user.id,
    });
    const { passwordHash: _, ...safe } = admin.toObject();
    await writeAuditLog({ action: 'admin.create', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'admin', targetId: admin._id.toString(), targetName: admin.username });
    return NextResponse.json(safe, { status: 201 });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email' ? 'Email already registered' : field === 'username' ? 'Username already taken' : 'An admin with that value already exists';
      return NextResponse.json({ message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
