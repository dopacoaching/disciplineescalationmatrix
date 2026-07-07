import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Student from '@/lib/server/models/Student';
import '@/lib/server/models/Batch';
import { getAuthUser, adminCanAccessBatch } from '@/lib/server/auth';
import { writeAuditLog } from '@/lib/server/audit';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const actionNote = body?.actionNote;
    if (!actionNote || typeof actionNote !== 'string' || actionNote.trim().length === 0) {
      return NextResponse.json({ message: 'actionNote is required' }, { status: 400 });
    }
    const target = await Student.findById(id).select('batchId');
    if (!target) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    if (!adminCanAccessBatch(user, target.batchId.toString())) return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    const student = await Student.findByIdAndUpdate(
      id,
      {
        lastClearedAt: new Date(),
        lastAdminActionNote: actionNote.trim(),
        lastClearedByUsername: user.username,
        currentEscalationLevel: 1,
      },
      { new: true }
    ).populate('batchId', 'name isArchived');
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    try {
      await writeAuditLog({
        action: 'student.clearFlag',
        actorId: user.id,
        actorUsername: user.username,
        actorRole: user.role,
        targetType: 'student',
        targetId: student._id.toString(),
        targetName: student.fullName,
        details: actionNote.trim(),
        batchIds: [target.batchId.toString()],
      });
    } catch { /* audit log failure must not roll back a successful flag clear */ }
    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
