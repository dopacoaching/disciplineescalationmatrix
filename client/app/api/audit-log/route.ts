import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import AuditLog from '@/lib/server/models/AuditLog';

const VALID_ACTIONS = new Set(['auth', 'staff', 'admin', 'batch', 'student', 'entry']);

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

    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) { const d = new Date(fromDate); if (!isNaN(d.getTime())) dateFilter.$gte = d; }
      if (toDate)   { const d = new Date(toDate);   if (!isNaN(d.getTime())) dateFilter.$lte = d; }
      if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
    }

    if (action && VALID_ACTIONS.has(action)) {
      filter.action = { $regex: `^${action}\\.`, $options: 'i' };
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
