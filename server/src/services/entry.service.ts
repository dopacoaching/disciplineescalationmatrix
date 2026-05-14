import Entry from '../models/Entry';
import Student from '../models/Student';
import { computeEscalationLevel } from '../utils/escalation';

export async function recalculateEscalation(studentId: string): Promise<void> {
  const entries = await Entry.find({ studentId });
  const hasHigh = entries.some(e => e.severity === 'high');
  const level = computeEscalationLevel(entries.length, hasHigh);
  await Student.findByIdAndUpdate(studentId, { currentEscalationLevel: level });
}
