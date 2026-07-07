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

    // Scoped admins may only manage staff that share one of their batches, and
    // their batch edits only control batches within their own scope.
    const scope = adminBatchScope(user);
    if (scope) {
      const existingStaff = await Staff.findById(id).select('assignedBatches');
      if (!existingStaff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });
      const existing: string[] = (existingStaff.assignedBatches || []).map((b: mongoose.Types.ObjectId) => b.toString());
      const inScopeSet = new Set(scope.map(id => id.toString()));
      // Must already co-manage this staff member (share at least one batch).
      if (!existing.some(b => inScopeSet.has(b))) {
        return NextResponse.json({ message: 'Access denied to this staff member' }, { status: 403 });
      }
      // When batches are edited, preserve the staff's batches outside this admin's
      // scope and let the admin control only the in-scope portion — they can
      // neither add batches they don't own nor strip ones another admin manages.
      if (rest.assignedBatches !== undefined) {
        const preserved = existing.filter(b => !inScopeSet.has(b));
        const submittedInScope = rest.assignedBatches.filter(b => inScopeSet.has(b));
        rest.assignedBatches = Array.from(new Set([...preserved, ...submittedInScope]));
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
    const staffBatchIds = (staff.assignedBatches || []).map((b: any) => (b?._id ?? b).toString());
    await writeAuditLog({ action, actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'staff', targetId: staff._id.toString(), targetName: staff.fullName, batchIds: staffBatchIds });
    return NextResponse.json(staff);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
