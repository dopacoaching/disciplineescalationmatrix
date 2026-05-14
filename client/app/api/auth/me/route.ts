import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import Admin from '@/lib/server/models/Admin';
import Staff from '@/lib/server/models/Staff';
import { getAuthUser } from '@/lib/server/auth';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    await connectDB();
    if (user.role === 'admin') {
      const admin = await Admin.findById(user.id).select('-passwordHash');
      if (!admin) return NextResponse.json({ message: 'Account not found' }, { status: 401 });
      return NextResponse.json({ ...admin.toObject(), role: 'admin' });
    }
    const staff = await Staff.findById(user.id).select('-passwordHash');
    if (!staff) return NextResponse.json({ message: 'Account not found' }, { status: 401 });
    return NextResponse.json({ ...staff.toObject(), role: staff.role });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
