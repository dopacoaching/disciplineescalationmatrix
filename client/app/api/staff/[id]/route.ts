import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Staff from '@/lib/server/models/Staff';
import '@/lib/server/models/Batch';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';
import { hashPassword } from '@/lib/server/hash';
import { updateStaffSchema } from '@/lib/server/validators/staff.validator';
import { writeAuditLog } from '@/lib/server/audit';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = updateStaffSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { password, ...rest } = result.data;

    // Scoped admins may only manage staff within their batches, and may not
    // assign batches outside their scope.
    const scope = adminBatchScope(user);
    if (scope) {
      const existingStaff = await Staff.findById(id).select('assignedBatches');
      if (!existingStaff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });
      const inScope = (existingStaff.assignedBatches || []).some((b: mongoose.Types.ObjectId) => scope.some(id => id.toString() === b.toString()));
      if (!inScope) return NextResponse.json({ message: 'Access denied to this staff member' }, { status: 403 });
      if (rest.assignedBatches && rest.assignedBatches.some(b => !scope.some(id => id.toString() === b))) {
        return NextResponse.json({ message: 'Cannot assign a batch outside your access' }, { status: 403 });
      }
    }

    const update: Record<string, unknown> = { ...rest };
    if (password) update.passwordHash = await hashPassword(password);
    const staff = await Staff.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select('-passwordHash').populate('assignedBatches', 'name');
    if (!staff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });
    const action = 'isActive' in rest
      ? rest.isActive ? 'staff.reactivate' : 'staff.deactivate'
      : 'staff.update';
    await writeAuditLog({ action, actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'staff', targetId: staff._id.toString(), targetName: staff.fullName });
    return NextResponse.json(staff);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
