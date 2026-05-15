import Entry from '../models/Entry';
import Student from '../models/Student';
import { computeEscalationLevel } from '../escalation';

export async function recalculateEscalation(studentId: string): Promise<void> {
  const [count, hasHighDoc] = await Promise.all([
    Entry.countDocuments({ studentId }),
    Entry.exists({ studentId, severity: 'high' }),
  ]);
  const level = computeEscalationLevel(count, !!hasHighDoc);
  await Student.findByIdAndUpdate(studentId, { currentEscalationLevel: level });
}
