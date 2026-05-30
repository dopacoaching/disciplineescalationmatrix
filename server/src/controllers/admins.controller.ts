import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Admin from '../models/Admin';
import { hashPassword } from '../utils/hash';

export async function getAdmins(_req: Request, res: Response): Promise<void> {
  const admins = await Admin.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json(admins);
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  const { email, username, password } = req.body;
  const passwordHash = await hashPassword(password);
  const admin = await Admin.create({
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    passwordHash,
    createdBy: req.user!.id,
  });
  const { passwordHash: _, ...safe } = admin.toObject();
  res.status(201).json(safe);
}

export async function updateAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid admin ID' });
    return;
  }
  if (id === req.user!.id) {
    res.status(403).json({ message: 'Cannot modify your own admin account' });
    return;
  }
  // Build update explicitly — updateAdminSchema only allows isActive
  const update: Record<string, unknown> = {};
  if (req.body.isActive !== undefined) update.isActive = req.body.isActive;

  const admin = await Admin.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    .select('-passwordHash');
  if (!admin) { res.status(404).json({ message: 'Admin not found' }); return; }
  res.json(admin);
}
