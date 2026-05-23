import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isDuplicateKeyError } from '@/lib/server/db';
import Staff from '@/lib/server/models/Staff';
import Entry from '@/lib/server/models/Entry';
import '@/lib/server/models/Batch';
import { getAuthUser } from '@/lib/server/auth';
import { hashPassword } from '@/lib/server/hash';
import { createStaffSchema } from '@/lib/server/validators/staff.validator';
import { writeAuditLog } from '@/lib/server/audit';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    await connectDB();
    const sp = req.nextUrl.searchParams;
    const search = sp.get('search');
    const role = sp.get('role');
    const batchId = sp.get('batchId');

    const filter: Record<string, unknown> = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
      filter.$or = [{ fullName: { $regex: escaped, $options: 'i' } }, { username: { $regex: escaped, $options: 'i' } }];
    }
    if (role) filter.role = role;
    if (batchId) filter.assignedBatches = batchId;

    const staff = await Staff.find(filter).select('-passwordHash').populate('assignedBatches', 'name');
    const staffIds = staff.map(s => s._id);
    const entryCounts = await Entry.aggregate([
      { $match: { staffId: { $in: staffIds } } },
      { $group: { _id: '$staffId', count: { $sum: 1 }, lastEntry: { $max: '$createdAt' } } },
    ]);
    const countMap: Record<string, { count: number; lastEntry: Date | null }> = {};
    entryCounts.forEach(e => { countMap[e._id.toString()] = { count: e.count, lastEntry: e.lastEntry }; });
    const result = staff.map(s => ({
      ...s.toObject(),
      entryCount: countMap[s._id.toString()]?.count || 0,
      lastEntryAt: countMap[s._id.toString()]?.lastEntry || null,
    }));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = createStaffSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const { fullName, username, password, role, assignedBatches } = result.data;
    const passwordHash = await hashPassword(password);
    const staff = await Staff.create({
      fullName, username: username.toLowerCase(), passwordHash, role,
      assignedBatches: assignedBatches || [], createdBy: user.id,
    });
    const { passwordHash: _, ...safe } = staff.toObject();
    await writeAuditLog({ action: 'staff.create', actorId: user.id, actorUsername: user.username, actorRole: user.role, targetType: 'staff', targetId: staff._id.toString(), targetName: staff.fullName });
    return NextResponse.json(safe, { status: 201 });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const field = Object.keys(err.keyPattern)[0];
      return NextResponse.json({ message: field === 'username' ? 'Username already taken' : 'A staff with that value already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
