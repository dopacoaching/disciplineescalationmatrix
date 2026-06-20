import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import Student from '@/lib/server/models/Student';
// Staff and Batch must be imported so Mongoose registers their models before populate runs
import '@/lib/server/models/Staff';
import '@/lib/server/models/Batch';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';
import { getRemarkById } from '@/lib/server/remarks';
import { computeEscalationLevel } from '@/lib/server/escalation';
import { createEntrySchema } from '@/lib/server/validators/entry.validator';
import { writeAuditLog } from '@/lib/server/audit';

const VALID_SEVERITIES = new Set(['low', 'medium', 'high']);
const VALID_SORTS = new Set(['oldest', 'newest', 'highest_severity']);

function parseDate(val: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    await connectDB();
    const sp = req.nextUrl.searchParams;
    const studentId = sp.get('studentId');
    const staffId = sp.get('staffId');
    const batchId = sp.get('batchId');
    const fromDate = sp.get('fromDate');
    const toDate = sp.get('toDate');
    const severity = sp.get('severity');
    const sort = sp.get('sort');

    if (severity && !VALID_SEVERITIES.has(severity)) return NextResponse.json({ message: 'Invalid severity value' }, { status: 400 });
    if (sort && !VALID_SORTS.has(sort)) return NextResponse.json({ message: 'Invalid sort value' }, { status: 400 });

    const filter: Record<string, unknown> = {};
    if (user.role !== 'admin') {
      filter.staffId = new mongoose.Types.ObjectId(user.id);
    } else if (staffId) {
      if (!mongoose.Types.ObjectId.isValid(staffId)) return NextResponse.json({ message: 'Invalid staffId' }, { status: 400 });
      filter.staffId = new mongoose.Types.ObjectId(staffId);
    }

    // Scoped admins may only see entries for students in their assigned batches.
    const scope = user.role === 'admin' ? adminBatchScope(user) : null;
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });
      if (scope) {
        const student = await Student.findById(studentId).select('batchId').lean();
        if (!student || !scope.some(id => id.toString() === student.batchId.toString())) {
          return NextResponse.json({ message: 'Access denied to this student' }, { status: 403 });
        }
      }
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    } else if (batchId) {
      if (!mongoose.Types.ObjectId.isValid(batchId)) return NextResponse.json({ message: 'Invalid batchId' }, { status: 400 });
      if (scope && !scope.some(id => id.toString() === batchId)) return NextResponse.json({ message: 'Access denied to this batch' }, { status: 403 });
      const studentsInBatch = await Student.find({ batchId: new mongoose.Types.ObjectId(batchId) }).select('_id').lean();
      filter.studentId = { $in: studentsInBatch.map(s => s._id) };
    } else if (scope) {
      // Scoped admin with no specific student/batch — restrict to all students in scope.
      const studentsInScope = await Student.find({ batchId: { $in: scope } }).select('_id').lean();
      filter.studentId = { $in: studentsInScope.map(s => s._id) };
    }
    if (severity) filter.severity = severity;

    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    if ((fromDate && !from) || (toDate && !to)) return NextResponse.json({ message: 'Invalid date format' }, { status: 400 });
    if (from || to) filter.createdAt = {
      ...(from ? { $gte: from } : {}),
      ...(to   ? { $lte: new Date(to.getTime() + 86399999) } : {}),
    };

    const SEVERITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const sortOption: Record<string, 1 | -1> =
      sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const entries = await Entry.find(filter)
      .populate({ path: 'studentId', select: 'fullName registerNumber batchId', populate: { path: 'batchId', select: 'name' } })
      .populate('staffId', 'fullName username role')
      .sort(sortOption);

    if (sort === 'highest_severity') {
      entries.sort((a, b) =>
        (SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]) ||
        (b.createdAt.getTime() - a.createdAt.getTime())
      );
    }
    return NextResponse.json(entries);
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
    const result = createEntrySchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { studentId, remarkId, customRemark } = result.data;

    const remark = getRemarkById(remarkId);
    if (!remark) return NextResponse.json({ message: 'Invalid remarkId' }, { status: 400 });
    const student = await Student.findById(studentId);
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    if (!(user.assignedBatches || []).includes(student.batchId.toString())) {
      return NextResponse.json({ message: 'Access denied to this student' }, { status: 403 });
    }
    if (remarkId === 'other' && (!customRemark || customRemark.trim().length === 0)) {
      return NextResponse.json({ message: 'Custom remark is required' }, { status: 400 });
    }

    const clearDate = (student as any).lastClearedAt;
    const dateFilter = clearDate ? { createdAt: { $gt: clearDate } } : {};
    const [existingCount, hasHighExisting] = await Promise.all([
      Entry.countDocuments({ studentId, ...dateFilter }),
      Entry.exists({ studentId, severity: 'high', ...dateFilter }),
    ]);
    const hasHigh = remark.severity === 'high' || !!hasHighExisting;
    const escalationLevel = computeEscalationLevel(existingCount + 1, hasHigh);

    const entry = await Entry.create({
      studentId, staffId: user.id, remarkId,
      customRemark: customRemark || '', severity: remark.severity, escalationLevel, createdAt: new Date(),
    });
    await Student.findByIdAndUpdate(studentId, { currentEscalationLevel: escalationLevel });
    await writeAuditLog({ action: 'entry.create', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'student', targetId: studentId, targetName: student.fullName });
    const populated = await entry.populate([
      { path: 'studentId', select: 'fullName registerNumber batchId', populate: { path: 'batchId', select: 'name' } },
      { path: 'staffId', select: 'fullName username role' },
    ]);
    return NextResponse.json(populated, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
