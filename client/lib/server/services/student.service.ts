import mongoose from 'mongoose';
import Entry from '../models/Entry';

export async function getEntryCountsForStudents(
  studentIds: mongoose.Types.ObjectId[],
  fromDate?: string,
  toDate?: string,
): Promise<Record<string, number>> {
  const match: Record<string, unknown> = { studentId: { $in: studentIds } };
  if (fromDate || toDate) {
    match.createdAt = {
      ...(fromDate ? { $gte: new Date(fromDate) } : {}),
      ...(toDate ? { $lte: new Date(toDate) } : {}),
    };
  }
  const counts = await Entry.aggregate([
    { $match: match },
    { $group: { _id: '$studentId', count: { $sum: 1 } } },
  ]);
  const map: Record<string, number> = {};
  counts.forEach(c => { map[c._id.toString()] = c.count; });
  return map;
}
