import Entry from '../models/Entry';
import mongoose from 'mongoose';

export async function getEntryCountsForStudents(
  studentIds: mongoose.Types.ObjectId[],
  fromDate?: string,
  toDate?: string
): Promise<Record<string, number>> {
  const match: Record<string, unknown> = { studentId: { $in: studentIds } };
  if (fromDate || toDate) {
    match.createdAt = {
      ...(fromDate ? { $gte: new Date(fromDate) } : {}),
      // Add 86399999 ms (23:59:59.999) so toDate is inclusive of the full selected day
      ...(toDate ? { $lte: new Date(new Date(toDate).getTime() + 86399999) } : {}),
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
