import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import { getAuthUser } from '@/lib/server/auth';
import { recalculateEscalation } from '@/lib/server/services/entry.service';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    await connectDB();
    const entry = await Entry.findById(id);
    if (!entry) return NextResponse.json({ message: 'Entry not found' }, { status: 404 });
    const studentId = entry.studentId.toString();
    await Entry.findByIdAndDelete(id);
    await recalculateEscalation(studentId);
    return NextResponse.json({ message: 'Entry deleted' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
