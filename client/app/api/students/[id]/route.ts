import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import Student from '@/lib/server/models/Student';
import Entry from '@/lib/server/models/Entry';
import { getAuthUser } from '@/lib/server/auth';
import { updateStudentSchema } from '@/lib/server/validators/student.validator';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    await connectDB();
    const body = await req.json().catch(() => null);
    const result = updateStudentSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    const student = await Student.findByIdAndUpdate(id, result.data, { new: true, runValidators: true });
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    const { id } = await params;
    await connectDB();
    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    await Entry.deleteMany({ studentId: id });
    await Student.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Student and all entries deleted' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
