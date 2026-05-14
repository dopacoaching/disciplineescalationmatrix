import Entry from '../models/Entry';
import Student from '../models/Student';
import Staff from '../models/Staff';

export function buildDateFilter(fromDate?: string, toDate?: string): Record<string, unknown> {
  if (!fromDate && !toDate) return {};
  return {
    createdAt: {
      ...(fromDate ? { $gte: new Date(fromDate) } : {}),
      ...(toDate ? { $lte: new Date(toDate) } : {}),
    },
  };
}

export async function getAdminStats(dateFilter: Record<string, unknown>) {
  const [totalEntries, highSeverityCount, flaggedCount, adminActionCount] = await Promise.all([
    Entry.countDocuments(dateFilter),
    Entry.countDocuments({ ...dateFilter, severity: 'high' }),
    Student.countDocuments({ currentEscalationLevel: 2 }),
    Student.countDocuments({ currentEscalationLevel: 3 }),
  ]);
  return { totalEntries, flaggedCount, adminActionCount, highSeverityCount };
}

export async function getFlaggedStudentsWithCounts(dateFilter: Record<string, unknown>) {
  const students = await Student.find({ currentEscalationLevel: { $gte: 2 } })
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

export async function getStaffActivityWithCounts(dateFilter: Record<string, unknown>) {
  const staff = await Staff.find().select('-passwordHash').sort({ fullName: 1 });
  const staffIds = staff.map(s => s._id);
  const activity = await Entry.aggregate([
    { $match: { staffId: { $in: staffIds }, ...dateFilter } },
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
