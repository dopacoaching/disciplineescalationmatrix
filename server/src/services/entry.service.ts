import Entry from '../models/Entry';
import Student from '../models/Student';
import { computeEscalationLevel } from '../utils/escalation';

export async function recalculateEscalation(studentId: string): Promise<void> {
  const student = await Student.findById(studentId).select('lastClearedAt').lean();
  const clearDate = student?.lastClearedAt;
  const dateFilter = clearDate ? { createdAt: { $gt: clearDate } } : {};
  const [count, hasHighDoc] = await Promise.all([
    Entry.countDocuments({ studentId, ...dateFilter }),
    Entry.exists({ studentId, severity: 'high', ...dateFilter }),
  ]);
  const level = computeEscalationLevel(count, !!hasHighDoc);
  await Student.findByIdAndUpdate(studentId, { currentEscalationLevel: level });
}
