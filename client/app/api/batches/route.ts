import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/server/db';
import Batch from '@/lib/server/models/Batch';
import { getAuthUser } from '@/lib/server/auth';
import { createBatchSchema } from '@/lib/server/validators/batch.validator';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    await connectDB();
    if (user.role === 'admin') {
      return NextResponse.json(await Batch.find().sort({ createdAt: -1 }));
    }
    const ids = (user.assignedBatches || []).map(id => new mongoose.Types.ObjectId(id));
    return NextResponse.json(await Batch.find({ _id: { $in: ids } }).sort({ createdAt: -1 }));
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
    const result = createBatchSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const batch = await Batch.create({ name: result.data.name, createdBy: user.id });
    return NextResponse.json(batch, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
