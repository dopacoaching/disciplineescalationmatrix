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
      if (!admin || !admin.isActive) return NextResponse.json({ message: 'Account not found' }, { status: 401 });
      const adminObj = admin.toObject();
      // Normalize legacy admins (missing field) to super; scoped admins have no batch scope here as ids
      const superAdmin = adminObj.isSuperAdmin !== false;
      return NextResponse.json({
        ...adminObj,
        role: 'admin',
        isSuperAdmin: superAdmin,
        assignedBatches: superAdmin ? [] : (adminObj.assignedBatches || []).map((id: { toString(): string }) => id.toString()),
      });
    }
    const staff = await Staff.findById(user.id).select('-passwordHash');
    if (!staff || !staff.isActive) return NextResponse.json({ message: 'Account not found' }, { status: 401 });
    return NextResponse.json({ ...staff.toObject(), role: staff.role });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
