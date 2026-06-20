import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Student from '@/lib/server/models/Student';
import '@/lib/server/models/Batch';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';
import { getEntryCountsForStudents } from '@/lib/server/services/student.service';
import { createStudentSchema } from '@/lib/server/validators/student.validator';
import { writeAuditLog } from '@/lib/server/audit';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    await connectDB();
    const sp = req.nextUrl.searchParams;
    const batchId = sp.get('batchId');
    const search = sp.get('search');
    const escalationLevel = sp.get('escalationLevel');
    const sort = sp.get('sort');
    const fromDate = sp.get('fromDate') ?? undefined;
    const toDate = sp.get('toDate') ?? undefined;

    const filter: Record<string, unknown> = {};
    // Batch scope: null = unrestricted (staff use their own list below; super admins see all).
    const scope = user.role === 'admin' ? adminBatchScope(user) : (user.assignedBatches || []).map(id => new mongoose.Types.ObjectId(id));
    if (scope) {
      // Scoped admin or staff — limited to their assigned batches.
      if (batchId) {
        // A specific batch was picked — narrow to it, but only if it is within scope.
        if (!mongoose.Types.ObjectId.isValid(batchId)) return NextResponse.json({ message: 'Invalid batchId' }, { status: 400 });
        if (!scope.some(id => id.toString() === batchId)) return NextResponse.json({ message: 'Access denied to this batch' }, { status: 403 });
        filter.batchId = new mongoose.Types.ObjectId(batchId);
      } else {
        filter.batchId = { $in: scope };
      }
    } else if (batchId) {
      // Super admin filtering by a specific batch.
      if (!mongoose.Types.ObjectId.isValid(batchId)) return NextResponse.json({ message: 'Invalid batchId' }, { status: 400 });
      filter.batchId = new mongoose.Types.ObjectId(batchId);
    }
    if (escalationLevel) {
      const lvl = parseInt(escalationLevel, 10);
      if (![1, 2, 3].includes(lvl)) return NextResponse.json({ message: 'Invalid escalationLevel' }, { status: 400 });
      filter.currentEscalationLevel = lvl;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
      filter.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { registerNumber: { $regex: escaped, $options: 'i' } },
      ];
    }

    const sortOption: Record<string, 1 | -1> =
      sort === 'az' ? { fullName: 1 }
      : sort === 'most_flagged' ? { currentEscalationLevel: -1 }
      : sort === 'least_flagged' ? { currentEscalationLevel: 1 }
      : { createdAt: -1 };

    const students = await Student.find(filter)
      .populate('batchId', 'name isArchived')
      .sort(sortOption)
      .lean();  // skip Mongoose document hydration — we only need plain objects here
    const studentIds = students.map(s => s._id as mongoose.Types.ObjectId);
    const entryCountMap = await getEntryCountsForStudents(studentIds, fromDate, toDate);
    const result = students.map(s => ({ ...s, entryCount: entryCountMap[s._id.toString()] || 0 }));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role === 'admin') return NextResponse.json({ message: 'Staff access required' }, { status: 403 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = createStudentSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { registerNumber, fullName, batchId } = result.data;

    const assignedBatches = user.assignedBatches || [];
    if (!assignedBatches.includes(batchId)) {
      return NextResponse.json({ message: 'Access denied to this batch' }, { status: 403 });
    }
    const existing = await Student.findOne({ registerNumber, batchId });
    if (existing) return NextResponse.json({ message: 'Register number already exists in this batch' }, { status: 409 });
    const student = await Student.create({ registerNumber, fullName, batchId, createdBy: user.id });
    await writeAuditLog({ action: 'student.create', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'student', targetId: student._id.toString(), targetName: fullName });
    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
