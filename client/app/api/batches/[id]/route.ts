import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Batch from '@/lib/server/models/Batch';
import Student from '@/lib/server/models/Student';
import { getAuthUser, isSuperAdmin } from '@/lib/server/auth';
import { updateBatchSchema } from '@/lib/server/validators/batch.validator';
import { writeAuditLog } from '@/lib/server/audit';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (!isSuperAdmin(user)) return NextResponse.json({ message: 'Super admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = updateBatchSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const batch = await Batch.findByIdAndUpdate(id, result.data, { new: true, runValidators: true });
    if (!batch) return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    await writeAuditLog({ action: 'batch.update', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'batch', targetId: batch._id.toString(), targetName: batch.name, batchIds: [batch._id.toString()] });
    return NextResponse.json(batch);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (!isSuperAdmin(user)) return NextResponse.json({ message: 'Super admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const studentCount = await Student.countDocuments({ batchId: id });
    if (studentCount > 0) return NextResponse.json({ message: 'Cannot delete batch with students' }, { status: 400 });
    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) return NextResponse.json({ message: 'Batch not found' }, { status: 404 });
    await writeAuditLog({ action: 'batch.delete', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'batch', targetId: id, targetName: batch.name, batchIds: [id] });
    return NextResponse.json({ message: 'Batch deleted' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
