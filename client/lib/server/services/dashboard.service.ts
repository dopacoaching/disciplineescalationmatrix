import mongoose from 'mongoose';
import Entry from '../models/Entry';
import Student from '../models/Student';
import Staff from '../models/Staff';
import '../models/Batch';

// A batch scope of `null` means unrestricted (super admin). An array restricts
// every metric to students/staff belonging to those batches (scoped admin).
type BatchScope = mongoose.Types.ObjectId[] | null;

export function buildDateFilter(fromDate?: string, toDate?: string): Record<string, unknown> {
  if (!fromDate && !toDate) return {};
  return {
    createdAt: {
      ...(fromDate ? { $gte: new Date(fromDate) } : {}),
      ...(toDate ? { $lte: new Date(new Date(toDate).getTime() + 86399999) } : {}),
    },
  };
}

// Resolve the set of student ids that fall within a batch scope (for entry queries).
async function studentIdsInScope(scope: BatchScope): Promise<mongoose.Types.ObjectId[] | null> {
  if (!scope) return null;
  const students = await Student.find({ batchId: { $in: scope } }).select('_id').lean();
  return students.map(s => s._id as mongoose.Types.ObjectId);
}

export async function getAdminStats(dateFilter: Record<string, unknown>, scope: BatchScope = null) {
  const studentIds = await studentIdsInScope(scope);
  const entryScope = studentIds ? { studentId: { $in: studentIds } } : {};
  const studentScope = scope ? { batchId: { $in: scope } } : {};

  const [totalEntries, highSeverityCount, flaggedCount, adminActionCount] = await Promise.all([
    Entry.countDocuments({ ...dateFilter, ...entryScope }),
    Entry.countDocuments({ ...dateFilter, ...entryScope, severity: 'high' }),
    Student.countDocuments({ ...studentScope, currentEscalationLevel: 2 }),
    Student.countDocuments({ ...studentScope, currentEscalationLevel: 3 }),
  ]);
  return { totalEntries, flaggedCount, adminActionCount, highSeverityCount };
}

export async function getFlaggedStudentsWithCounts(dateFilter: Record<string, unknown>, scope: BatchScope = null) {
  const studentFilter: Record<string, unknown> = { currentEscalationLevel: { $gte: 2 } };
  if (scope) studentFilter.batchId = { $in: scope };

  const students = await Student.find(studentFilter)
    .populate('batchId', 'name')
    .sort({ currentEscalationLevel: -1 });
  const studentIds = students.map(s => s._id);
  const entryCounts = await Entry.aggregate([
    { $match: { studentId: { $in: studentIds }, ...dateFilter } },
    { $group: { _id: '$studentId', count: { $sum: 1 }, lastEntry: { $max: '$createdAt' } } },
  ]);
  const map: Record<string, { count: number; lastEntry: Date | null }> = {};
  entryCounts.forEach(e => { map[e._id.toString()] = { count: e.count, lastEntry: e.lastEntry }; });
  return students.map(s => ({
    ...s.toObject(),
    entryCount: map[s._id.toString()]?.count || 0,
    lastEntryAt: map[s._id.toString()]?.lastEntry || null,
  }));
}

export async function getStaffActivityWithCounts(dateFilter: Record<string, unknown>, scope: BatchScope = null) {
  const staffFilter: Record<string, unknown> = {};
  if (scope) staffFilter.assignedBatches = { $in: scope };

  const staff = await Staff.find(staffFilter).select('-passwordHash').sort({ fullName: 1 });
  const staffIds = staff.map(s => s._id);
  // Count only entries about in-scope students, so a scoped admin doesn't see a
  // staff member's activity volume in batches outside their scope.
  const studentIds = await studentIdsInScope(scope);
  const studentMatch = studentIds ? { studentId: { $in: studentIds } } : {};
  const activity = await Entry.aggregate([
    { $match: { staffId: { $in: staffIds }, ...studentMatch, ...dateFilter } },
    { $group: { _id: '$staffId', count: { $sum: 1 }, lastEntry: { $max: '$createdAt' } } },
  ]);
  const actMap: Record<string, { count: number; lastEntry: Date | null }> = {};
  activity.forEach(a => { actMap[a._id.toString()] = { count: a.count, lastEntry: a.lastEntry }; });
  return staff.map(s => ({
    ...s.toObject(),
    entryCount: actMap[s._id.toString()]?.count || 0,
    lastEntryAt: actMap[s._id.toString()]?.lastEntry || null,
  }));
}
