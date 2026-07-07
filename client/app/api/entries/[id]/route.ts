import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import Student from '@/lib/server/models/Student';
import { getAuthUser, adminCanAccessBatch, isSuperAdmin } from '@/lib/server/auth';
import { recalculateEscalation } from '@/lib/server/services/entry.service';
import { writeAuditLog } from '@/lib/server/audit';
import { remarkLabel } from '@/lib/server/remarks';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    const entry = await Entry.findById(id);
    if (!entry) return NextResponse.json({ message: 'Entry not found' }, { status: 404 });
    const studentId = entry.studentId.toString();
    // Scoped admins can only delete entries for students in their batches. A
    // dangling entry with no matching student can't be scope-checked, so
    // only a super admin may act on it — deny by default rather than
    // silently letting a scoped admin bypass the batch check.
    const student = await Student.findById(studentId).select('batchId fullName');
    if (student ? !adminCanAccessBatch(user, student.batchId.toString()) : !isSuperAdmin(user)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    await Entry.findByIdAndDelete(id);
    await recalculateEscalation(studentId);
    const remarkDetail = remarkLabel(entry.remarkId, entry.customRemark);
    await writeAuditLog({
      action: 'entry.delete',
      actorId: user.id,
      actorUsername: user.username,
      actorRole: user.role,
      targetType: 'student',
      targetId: studentId,
      targetName: student?.fullName,
      details: `Deleted entry (${remarkDetail}, ${entry.severity} severity)`,
      batchIds: student ? [student.batchId.toString()] : [],
    });
    return NextResponse.json({ message: 'Entry deleted' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
