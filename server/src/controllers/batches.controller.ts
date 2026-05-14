import { Request, Response } from 'express';
import Batch from '../models/Batch';
import Student from '../models/Student';
import mongoose from 'mongoose';

export async function getBatches(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  if (user.role === 'admin') {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json(batches);
    return;
  }
  const ids = (user.assignedBatches || []).map(id => new mongoose.Types.ObjectId(id));
  const batches = await Batch.find({ _id: { $in: ids } }).sort({ createdAt: -1 });
  res.json(batches);
}

export async function createBatch(req: Request, res: Response): Promise<void> {
  const { name } = req.body;
  const batch = await Batch.create({ name, createdBy: req.user!.id });
  res.status(201).json(batch);
}

export async function updateBatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const batch = await Batch.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }
  res.json(batch);
}

export async function deleteBatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const studentCount = await Student.countDocuments({ batchId: id });
  if (studentCount > 0) {
    res.status(400).json({ message: 'Cannot delete batch with students' });
    return;
  }
  await Batch.findByIdAndDelete(id);
  res.json({ message: 'Batch deleted' });
}
