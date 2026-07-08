import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';
import AuditLog from '@/lib/server/models/AuditLog';
import Student from '@/lib/server/models/Student';
import { AUDIT_ACTION_CATEGORIES, AUDIT_ACTION_LABELS } from '@/lib/server/auditActions';

// Records written before `details` was captured on student.clearFlag events
// have no note stored on the audit log itself, but the note still lives on
// the student's own lastAdminActionNote field. Backfill it at read time when
// the student's last-cleared timestamp lines up with this log entry.
async function backfillClearFlagDetails(logs: any[]): Promise<void> {
  const missing = logs.filter(l => l.action === 'student.clearFlag' && !l.details && l.targetId);
  if (missing.length === 0) return;
  const students = await Student.find({ _id: { $in: missing.map(l => l.targetId) } })
    .select('lastAdminActionNote lastClearedAt')
    .lean();
  const byId = new Map(students.map(s => [s._id.toString(), s]));
  for (const log of missing) {
    const student = byId.get(log.targetId);
    if (!student?.lastAdminActionNote || !student.lastClearedAt) continue;
    const drift = Math.abs(new Date(student.lastClearedAt).getTime() - new Date(log.createdAt).getTime());
    if (drift < 5000) log.details = student.lastAdminActionNote;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    await connectDB();

    const sp = req.nextUrl.searchParams;
    const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '50', 10) || 50, 1), 100);
    const fromDate = sp.get('fromDate');
    const toDate = sp.get('toDate');
    const action = sp.get('action');

    const filter: Record<string, unknown> = {};

    // Scoped admins only see actions tagged with one of their batches.
    const scope = adminBatchScope(user);
    if (scope) filter.batchIds = { $in: scope };

    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) { const d = new Date(fromDate); if (!isNaN(d.getTime())) dateFilter.$gte = d; }
      if (toDate)   { const d = new Date(toDate);   if (!isNaN(d.getTime())) dateFilter.$lte = new Date(d.getTime() + 86399999); }
      if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
    }

    // `action` may be a category prefix ("student" -> all student.* events)
    // or an exact action name ("student.clearFlag" -> just that one).
    if (action && AUDIT_ACTION_CATEGORIES.has(action)) {
      filter.action = { $regex: `^${action}\\.`, $options: 'i' };
    } else if (action && action in AUDIT_ACTION_LABELS) {
      filter.action = action;
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    await backfillClearFlagDetails(logs);
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
