import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, isDuplicateKeyError } from '@/lib/server/db';
import Admin from '@/lib/server/models/Admin';
import { getAuthUser, isSuperAdmin } from '@/lib/server/auth';
import { hashPassword } from '@/lib/server/hash';
import { updateAdminSchema } from '@/lib/server/validators/admin.validator';
import { writeAuditLog } from '@/lib/server/audit';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (!isSuperAdmin(user)) return NextResponse.json({ message: 'Super admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    if (id === user.id) return NextResponse.json({ message: 'Cannot modify your own admin account' }, { status: 403 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = updateAdminSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { fullName, email, username, password, isSuperAdmin: newSuper, assignedBatches, isActive } = result.data;

    const existing = await Admin.findById(id).select('isSuperAdmin assignedBatches');
    if (!existing) return NextResponse.json({ message: 'Admin not found' }, { status: 404 });

    // A scoped (non-super) admin must always have at least one batch, or they'd
    // see nothing — resolve against whichever of these fields is actually changing.
    const effectiveSuper = newSuper !== undefined ? newSuper : existing.isSuperAdmin !== false;
    const effectiveBatches = assignedBatches !== undefined
      ? assignedBatches
      : (existing.assignedBatches || []).map((b: mongoose.Types.ObjectId) => b.toString());
    if (!effectiveSuper && effectiveBatches.length === 0) {
      return NextResponse.json({ message: 'Assign at least one batch, or make this admin a super admin' }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      // Super admins are unrestricted, so their batch list is irrelevant — store none.
      assignedBatches: effectiveSuper ? [] : effectiveBatches,
    };
    if (fullName !== undefined) update.fullName = fullName;
    if (email !== undefined) update.email = email.toLowerCase();
    if (username !== undefined) update.username = username.toLowerCase();
    if (newSuper !== undefined) update.isSuperAdmin = newSuper;
    if (isActive !== undefined) update.isActive = isActive;
    if (password) update.passwordHash = await hashPassword(password);

    const admin = await Admin.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select('-passwordHash').populate('assignedBatches', 'name');
    if (!admin) return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    const action = 'isActive' in result.data && Object.keys(result.data).length === 1
      ? result.data.isActive ? 'admin.reactivate' : 'admin.deactivate'
      : 'admin.update';
    await writeAuditLog({ action, actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'admin', targetId: admin._id.toString(), targetName: admin.username });
    return NextResponse.json(admin);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email' ? 'Email already registered' : field === 'username' ? 'Username already taken' : 'An admin with that value already exists';
      return NextResponse.json({ message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
