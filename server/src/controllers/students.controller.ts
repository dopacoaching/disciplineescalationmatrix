import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student';
import Entry from '../models/Entry';
import { getEntryCountsForStudents } from '../services/student.service';

export async function getStudents(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { batchId, search, escalationLevel, sort, fromDate, toDate } = req.query;

  const filter: Record<string, unknown> = {};

  if (user.role !== 'admin') {
    const ids = (user.assignedBatches || []).map(id => new mongoose.Types.ObjectId(id));
    filter.batchId = { $in: ids };
  } else if (batchId) {
    if (!mongoose.Types.ObjectId.isValid(batchId as string)) {
      res.status(400).json({ message: 'Invalid batchId' });
      return;
    }
    filter.batchId = new mongoose.Types.ObjectId(batchId as string);
  }

  if (escalationLevel) {
    const lvl = parseInt(escalationLevel as string, 10);
    if (![1, 2, 3].includes(lvl)) {
      res.status(400).json({ message: 'escalationLevel must be 1, 2, or 3' });
      return;
    }
    filter.currentEscalationLevel = lvl;
  }

  if (search) {
    // Escape regex special chars + cap length to prevent ReDoS
    const escaped = (search as string)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .slice(0, 100);
    filter.$or = [
      { fullName:       { $regex: escaped, $options: 'i' } },
      { registerNumber: { $regex: escaped, $options: 'i' } },
    ];
  }

  const sortOption: Record<string, 1 | -1> =
    sort === 'az'            ? { fullName: 1 }
    : sort === 'most_flagged'  ? { currentEscalationLevel: -1 }
    : sort === 'least_flagged' ? { currentEscalationLevel: 1 }
    : { createdAt: -1 };

  const students = await Student.find(filter)
    .populate('batchId', 'name isArchived')
    .sort(sortOption)
    .lean();

  const studentIds = students.map(s => s._id as mongoose.Types.ObjectId);
  const entryCountMap = await getEntryCountsForStudents(
    studentIds,
    fromDate as string | undefined,
    toDate as string | undefined,
  );

  const result = students.map(s => ({
    ...s,
    entryCount: entryCountMap[s._id.toString()] || 0,
  }));

  res.json(result);
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const { registerNumber, fullName, batchId } = req.body;
  const user = req.user!;

  const existing = await Student.findOne({ registerNumber, batchId });
  if (existing) {
    res.status(409).json({ message: 'Register number already exists in this batch' });
    return;
  }

  const student = await Student.create({
    registerNumber,
    fullName,
    batchId,
    createdBy: user.id,
  });
  res.status(201).json(student);
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid student ID' });
    return;
  }
  // Build update explicitly — never pass req.body directly (prevents mass-assignment).
  // currentEscalationLevel is always computed; never allow direct override.
  const update: Record<string, unknown> = {};
  if (req.body.fullName !== undefined) update.fullName = req.body.fullName;
  if (req.body.batchId  !== undefined) update.batchId  = req.body.batchId;

  const student = await Student.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
  res.json(student);
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid student ID' });
    return;
  }
  const student = await Student.findById(id);
  if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
  await Entry.deleteMany({ studentId: id });
  await Student.findByIdAndDelete(id);
  res.json({ message: 'Student and all entries deleted' });
}
