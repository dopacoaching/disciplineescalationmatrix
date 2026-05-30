import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import Admin from '../models/Admin';
import Staff from '../models/Staff';
import { verifyPassword } from '../utils/hash';

function parseExpiryToMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 8 * 60 * 60 * 1000;
  const val = parseInt(match[1], 10);
  const mult: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * (mult[match[2]] ?? 3_600_000);
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    // maxAge must match the JWT expiry so the cookie and token expire together
    maxAge: parseExpiryToMs(env.JWT_EXPIRES_IN),
    path: '/',
  });
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { identifier, password } = req.body;

  const admin = await Admin.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  });

  if (!admin || !admin.isActive) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: admin._id.toString(), role: 'admin', username: admin.username },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  setAuthCookie(res, token);
  res.json({ id: admin._id, username: admin.username, role: 'admin' });
}

export async function staffLogin(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  const staff = await Staff.findOne({ username: username.toLowerCase() });

  if (!staff) {
    res.status(401).json({ message: 'Invalid username or password' });
    return;
  }

  if (!staff.isActive) {
    res.status(403).json({ message: 'Account deactivated' });
    return;
  }

  const valid = await verifyPassword(password, staff.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Invalid username or password' });
    return;
  }

  const assignedBatches = staff.assignedBatches.map(id => id.toString());
  const token = jwt.sign(
    {
      id: staff._id.toString(),
      role: staff.role,
      username: staff.username,
      assignedBatches,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  setAuthCookie(res, token);
  res.json({
    id: staff._id,
    fullName: staff.fullName,
    username: staff.username,
    role: staff.role,
    assignedBatches,
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // path must match the path used when setting the cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  if (user.role === 'admin') {
    const admin = await Admin.findById(user.id).select('-passwordHash');
    if (!admin) { res.status(401).json({ message: 'Account not found' }); return; }
    res.json({ ...admin.toObject(), role: 'admin' });
    return;
  }
  const staff = await Staff.findById(user.id).select('-passwordHash');
  if (!staff) { res.status(401).json({ message: 'Account not found' }); return; }
  res.json({ ...staff.toObject(), role: staff.role });
}
