import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Entry from '@/lib/server/models/Entry';
import Staff from '@/lib/server/models/Staff';
import '@/lib/server/models/Student';
import { getAuthUser, adminBatchScope } from '@/lib/server/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    await connectDB();
    // Scoped admins may only view activity for staff in one of their batches.
    const scope = adminBatchScope(user);
    if (scope) {
      const staff = await Staff.findById(id).select('assignedBatches');
      if (!staff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });
      const inScope = (staff.assignedBatches || []).some((b: mongoose.Types.ObjectId) => scope.some(sid => sid.toString() === b.toString()));
      if (!inScope) return NextResponse.json({ message: 'Access denied to this staff member' }, { status: 403 });
    }
    const entries = await Entry.find({ staffId: id })
      .populate('studentId', 'fullName registerNumber')
      .sort({ createdAt: -1 });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
