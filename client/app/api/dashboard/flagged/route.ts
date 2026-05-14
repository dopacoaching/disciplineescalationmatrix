import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { buildDateFilter, getFlaggedStudentsWithCounts } from '@/lib/server/services/dashboard.service';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    await connectDB();
    const sp = req.nextUrl.searchParams;
    const dateFilter = buildDateFilter(sp.get('fromDate') ?? undefined, sp.get('toDate') ?? undefined);
    return NextResponse.json(await getFlaggedStudentsWithCounts(dateFilter));
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
