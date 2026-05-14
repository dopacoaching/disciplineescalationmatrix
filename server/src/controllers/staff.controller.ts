import { Request, Response } from 'express';
import Staff from '../models/Staff';
import Entry from '../models/Entry';
import { hashPassword } from '../utils/hash';

export async function getStaff(req: Request, res: Response): Promise<void> {
  const { search, role, batchId } = req.query;
  const filter: Record<string, unknown> = {};

  if (search) {
    const escaped = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
    filter.$or = [
      { fullName: { $regex: escaped, $options: 'i' } },
      { username: { $regex: escaped, $options: 'i' } },
    ];
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
  entryCounts.forEach(e => {
    countMap[e._id.toString()] = { count: e.count, lastEntry: e.lastEntry };
  });

  const result = staff.map(s => ({
    ...s.toObject(),
    entryCount: countMap[s._id.toString()]?.count || 0,
    lastEntryAt: countMap[s._id.toString()]?.lastEntry || null,
  }));

  res.json(result);
}

export async function createStaff(req: Request, res: Response): Promise<void> {
  const { fullName, username, password, role, assignedBatches } = req.body;
  const passwordHash = await hashPassword(password);
  const staff = await Staff.create({
    fullName,
    username: username.toLowerCase(),
    passwordHash,
    role,
    assignedBatches: assignedBatches || [],
    createdBy: req.user!.id,
  });
  const { passwordHash: _, ...safe } = staff.toObject();
  res.status(201).json(safe);
}

export async function updateStaff(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { password, ...rest } = req.body;

  const update: Record<string, unknown> = { ...rest };
  if (password) update.passwordHash = await hashPassword(password);

  const staff = await Staff.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    .select('-passwordHash')
    .populate('assignedBatches', 'name');

  if (!staff) { res.status(404).json({ message: 'Staff not found' }); return; }
  res.json(staff);
}

export async function getStaffEntries(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const entries = await Entry.find({ staffId: id })
    .populate('studentId', 'fullName registerNumber')
    .sort({ createdAt: -1 });
  res.json(entries);
}
