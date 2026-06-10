import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Entry from '../models/Entry';
import Student from '../models/Student';
import { getRemarkById } from '../constants/remarks';
import { computeEscalationLevel } from '../utils/escalation';
import { recalculateEscalation } from '../services/entry.service';

const VALID_SEVERITIES = new Set(['low', 'medium', 'high']);
const VALID_SORTS = new Set(['oldest', 'newest', 'highest_severity']);

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

export async function getEntries(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { studentId, staffId, batchId, fromDate, toDate, severity, sort } = req.query;

  if (severity && !VALID_SEVERITIES.has(severity as string)) {
    res.status(400).json({ message: 'Invalid severity value' });
    return;
  }
  if (sort && !VALID_SORTS.has(sort as string)) {
    res.status(400).json({ message: 'Invalid sort value' });
    return;
  }

  const filter: Record<string, unknown> = {};

  if (user.role !== 'admin') {
    filter.staffId = new mongoose.Types.ObjectId(user.id);
  } else if (staffId) {
    if (!mongoose.Types.ObjectId.isValid(staffId as string)) {
      res.status(400).json({ message: 'Invalid staffId' });
      return;
    }
    filter.staffId = new mongoose.Types.ObjectId(staffId as string);
  }

  if (studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId as string)) {
      res.status(400).json({ message: 'Invalid studentId' });
      return;
    }
    filter.studentId = new mongoose.Types.ObjectId(studentId as string);

    // Staff can only query entries for students in their own assigned batches
    if (user.role !== 'admin') {
      const student = await Student.findById(studentId).select('batchId').lean();
      if (!student || !(user.assignedBatches || []).includes(student.batchId.toString())) {
        res.status(403).json({ message: 'Access denied to this student' });
        return;
      }
    }
  } else if (batchId) {
    if (!mongoose.Types.ObjectId.isValid(batchId as string)) {
      res.status(400).json({ message: 'Invalid batchId' });
      return;
    }
    const studentsInBatch = await Student.find({ batchId: new mongoose.Types.ObjectId(batchId as string) }).select('_id').lean();
    filter.studentId = { $in: studentsInBatch.map(s => s._id) };
  }
  if (severity) filter.severity = severity;

  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  if ((fromDate && !from) || (toDate && !to)) {
    res.status(400).json({ message: 'Invalid date format' });
    return;
  }
  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: from } : {}),
      ...(to   ? { $lte: new Date(to.getTime() + 86399999) } : {}),
    };
  }

  // For highest_severity, fetch newest-first then re-sort in memory using numeric rank.
  // MongoDB string sort on 'severity' is alphabetical (medium > low > high) which is wrong.
  const SEVERITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const sortOption: Record<string, 1 | -1> =
    sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const entries = await Entry.find(filter)
    .populate('studentId', 'fullName registerNumber batchId')
    .populate('staffId', 'fullName username role')
    .sort(sortOption);

  if (sort === 'highest_severity') {
    entries.sort((a, b) =>
      (SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]) ||
      (b.createdAt.getTime() - a.createdAt.getTime())
    );
  }

  res.json(entries);
}

export async function createEntry(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { studentId, remarkId, customRemark } = req.body;

  const remark = getRemarkById(remarkId);
  if (!remark) {
    res.status(400).json({ message: 'Invalid remarkId' });
    return;
  }

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }

  const assignedBatches = user.assignedBatches || [];
  if (!assignedBatches.includes(student.batchId.toString())) {
    res.status(403).json({ message: 'Access denied to this student' });
    return;
  }

  if (remarkId === 'other' && (!customRemark || customRemark.trim().length === 0)) {
    res.status(400).json({ message: 'Custom remark is required' });
    return;
  }

  const clearDate = student.lastClearedAt;
  const dateFilter = clearDate ? { createdAt: { $gt: clearDate } } : {};
  const [existingCount, hasHighExisting] = await Promise.all([
    Entry.countDocuments({ studentId, ...dateFilter }),
    Entry.exists({ studentId, severity: 'high', ...dateFilter }),
  ]);
  const hasHigh = remark.severity === 'high' || !!hasHighExisting;
  const escalationLevel = computeEscalationLevel(existingCount + 1, hasHigh);

  const entry = await Entry.create({
    studentId,
    staffId: user.id,
    remarkId,
    customRemark: customRemark || '',
    severity: remark.severity,
    escalationLevel,
    createdAt: new Date(),
  });

  await Student.findByIdAndUpdate(studentId, { currentEscalationLevel: escalationLevel });

  const populated = await entry.populate([
    { path: 'studentId', select: 'fullName registerNumber batchId' },
    { path: 'staffId', select: 'fullName username role' },
  ]);

  res.status(201).json(populated);
}

export async function deleteEntry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid entry ID' });
    return;
  }
  const entry = await Entry.findById(id);
  if (!entry) { res.status(404).json({ message: 'Entry not found' }); return; }

  const studentId = entry.studentId.toString();
  await Entry.findByIdAndDelete(id);
  await recalculateEscalation(studentId);

  res.json({ message: 'Entry deleted' });
}
