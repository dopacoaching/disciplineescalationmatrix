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
    filter.batchId = new mongoose.Types.ObjectId(batchId as string);
  }

  if (escalationLevel) {
    filter.currentEscalationLevel = parseInt(escalationLevel as string, 10);
  }

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { registerNumber: { $regex: search, $options: 'i' } },
    ];
  }

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === 'az') sortOption = { fullName: 1 };
  else if (sort === 'most_flagged') sortOption = { currentEscalationLevel: -1 };
  else if (sort === 'least_flagged') sortOption = { currentEscalationLevel: 1 };

  const students = await Student.find(filter)
    .populate('batchId', 'name isArchived')
    .sort(sortOption);

  const studentIds = students.map(s => s._id as mongoose.Types.ObjectId);
  const entryCountMap = await getEntryCountsForStudents(
    studentIds,
    fromDate as string | undefined,
    toDate as string | undefined
  );

  const result = students.map(s => ({
    ...s.toObject(),
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
  const student = await Student.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
  res.json(student);
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const student = await Student.findById(id);
  if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
  await Entry.deleteMany({ studentId: id });
  await Student.findByIdAndDelete(id);
  res.json({ message: 'Student and all entries deleted' });
}
