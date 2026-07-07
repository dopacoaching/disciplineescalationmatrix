import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Student from '@/lib/server/models/Student';
import Entry from '@/lib/server/models/Entry';
import Staff from '@/lib/server/models/Staff';
import '@/lib/server/models/Batch';
import { getAuthUser, adminCanAccessBatch } from '@/lib/server/auth';
import { updateStudentSchema } from '@/lib/server/validators/student.validator';
import { writeAuditLog } from '@/lib/server/audit';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const student = await Student.findById(id).populate('batchId', 'name isArchived');
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    const batchIdStr = (student.batchId as any)?._id?.toString() ?? student.batchId.toString();
    const allowed = user.role === 'admin'
      ? adminCanAccessBatch(user, batchIdStr)
      : (user.assignedBatches || []).includes(batchIdStr);
    if (!allowed) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = updateStudentSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });

    const existing = await Student.findById(id).select('batchId');
    if (!existing) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    // Scoped admins may only edit students in their batches — and not move them out of scope.
    if (!adminCanAccessBatch(user, existing.batchId.toString())) return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    if (result.data.batchId && !adminCanAccessBatch(user, result.data.batchId)) return NextResponse.json({ message: 'Access denied to target batch' }, { status: 403 });

    const student = await Student.findByIdAndUpdate(id, result.data, { new: true, runValidators: true });
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    const oldBatchId = existing.batchId.toString();
    const batchIds = result.data.batchId && result.data.batchId !== oldBatchId
      ? [oldBatchId, result.data.batchId]
      : [oldBatchId];
    await writeAuditLog({ action: 'student.update', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'student', targetId: student._id.toString(), targetName: student.fullName, batchIds });
    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    const batchIdStr = student.batchId.toString();
    if (user.role === 'admin') {
      // Admins delete within their batch scope.
      if (!adminCanAccessBatch(user, batchIdStr)) return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    } else {
      // Staff may delete only if they are a campus in-charge AND the student is in
      // one of their assigned batches. Read live from the DB so the permission
      // takes effect (or is revoked) without requiring the staff to re-login.
      const me = await Staff.findById(user.id).select('isCampusIncharge assignedBatches isActive');
      if (!me || !me.isActive || !me.isCampusIncharge) {
        return NextResponse.json({ message: 'Campus in-charge permission required' }, { status: 403 });
      }
      if (!(me.assignedBatches || []).some((b: mongoose.Types.ObjectId) => b.toString() === batchIdStr)) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }
    }
    // Cascade: remove the student and every entry recorded against them.
    await Entry.deleteMany({ studentId: id });
    await Student.findByIdAndDelete(id);
    await writeAuditLog({ action: 'student.delete', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'student', targetId: id, targetName: student.fullName, batchIds: [batchIdStr] });
    return NextResponse.json({ message: 'Student and all entries deleted' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
