import Entry from '../models/Entry';
import Student from '../models/Student';
import { computeEscalationLevel } from '../utils/escalation';

export async function recalculateEscalation(studentId: string): Promise<void> {
  // Use countDocuments + exists instead of loading all entry documents into memory
  const [count, hasHighDoc] = await Promise.all([
    Entry.countDocuments({ studentId }),
    Entry.exists({ studentId, severity: 'high' }),
  ]);
  const level = computeEscalationLevel(count, !!hasHighDoc);
  await Student.findByIdAndUpdate(studentId, { currentEscalationLevel: level });
}
