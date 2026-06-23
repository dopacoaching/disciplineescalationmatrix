import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import Staff from '@/lib/server/models/Staff';
import '@/lib/server/models/Batch';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';

type Ctx = { params: Promise<{ id: string }> };

// Day boundaries are computed in IST (Asia/Kolkata) so "which day an entry
// belongs to" and "which days were missed" match how staff actually work.
const TZ = 'Asia/Kolkata';
const istDateStr = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD

// Every calendar day (IST) from `startStr` to `endStr` inclusive. India has no
// DST, so advancing a fixed +05:30 timestamp by 24h always lands on the next day.
function eachDay(startStr: string, endStr: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startStr}T12:00:00+05:30`);
  let guard = 0;
  while (guard++ < 4000) {
    const s = istDateStr(cursor);
    days.push(s);
    if (s >= endStr) break;
    cursor.setTime(cursor.getTime() + 86400000);
  }
  return days;
}

export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();

    const staff = await Staff.findById(id).select('-passwordHash').populate('assignedBatches', 'name').lean();
    if (!staff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });

    // Scoped admins may only view staff in one of their batches.
    const scope = adminBatchScope(user);
    if (scope) {
      const inScope = ((staff as any).assignedBatches || []).some((b: any) =>
        scope.some(sid => sid.toString() === (b._id ?? b).toString()));
      if (!inScope) return NextResponse.json({ message: 'Access denied to this staff member' }, { status: 403 });
    }

    const staffId = new mongoose.Types.ObjectId(id);
    const [daily, severity, totals] = await Promise.all([
      Entry.aggregate([
        { $match: { staffId } },
        { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: TZ } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
      Entry.aggregate([
        { $match: { staffId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Entry.aggregate([
        { $match: { staffId } },
        { $group: { _id: null, total: { $sum: 1 }, first: { $min: '$createdAt' }, last: { $max: '$createdAt' } } },
      ]),
    ]);

    const totalEntries: number = totals[0]?.total ?? 0;
    const firstEntryAt: Date | null = totals[0]?.first ?? null;
    const lastEntryAt: Date | null = totals[0]?.last ?? null;

    const bySeverity = { low: 0, medium: 0, high: 0 } as Record<string, number>;
    severity.forEach((s: { _id: string; count: number }) => { bySeverity[s._id] = s.count; });

    // Range over which "missed days" is meaningful: from the day the staff joined
    // (or their first entry, whichever is earlier) through today, in IST.
    const todayStr = istDateStr(new Date());
    const joinStr = istDateStr(new Date((staff as any).createdAt));
    const firstStr = firstEntryAt ? istDateStr(firstEntryAt) : joinStr;
    const startStr = joinStr < firstStr ? joinStr : firstStr;

    const activeSet = new Set<string>(daily.map((d: { _id: string }) => d._id));
    const allDays = eachDay(startStr, todayStr);
    const missedDates = allDays.filter(d => !activeSet.has(d)).reverse(); // most recent first

    return NextResponse.json({
      staff,
      totalEntries,
      firstEntryAt,
      lastEntryAt,
      bySeverity,
      daily, // [{ _id: 'YYYY-MM-DD', count }], most recent first
      activeDays: activeSet.size,
      missedDays: missedDates.length,
      missedDates,
      rangeStart: startStr,
      rangeDays: allDays.length,
    });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
