import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import Admin from '@/lib/server/models/Admin';
import { getAuthUser } from '@/lib/server/auth';
import { updateAdminSchema } from '@/lib/server/validators/admin.validator';
import { writeAuditLog } from '@/lib/server/audit';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    if (id === user.id) return NextResponse.json({ message: 'Cannot modify your own admin account' }, { status: 403 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = updateAdminSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const admin = await Admin.findByIdAndUpdate(id, result.data, { new: true, runValidators: true }).select('-passwordHash');
    if (!admin) return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    const action = 'isActive' in result.data
      ? result.data.isActive ? 'admin.reactivate' : 'admin.deactivate'
      : 'admin.update';
    await writeAuditLog({ action, actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'admin', targetId: admin._id.toString(), targetName: admin.username });
    return NextResponse.json(admin);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
