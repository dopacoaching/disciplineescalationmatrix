export type Severity = 'low' | 'medium' | 'high';
export type StaffRole = 'teacher' | 'warden';
export type EscalationLevel = 1 | 2 | 3;

export interface Batch {
  _id: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Student {
  _id: string;
  registerNumber: string;
  fullName: string;
  batchId: string | Batch;
  currentEscalationLevel: EscalationLevel;
  entryCount: number;
  createdAt: string;
}

export interface PopulatedStudent {
  _id: string;
  registerNumber: string;
  fullName: string;
  batchId: Batch;
  currentEscalationLevel: EscalationLevel;
  entryCount: number;
  createdAt: string;
}

export interface StaffRef {
  _id: string;
  fullName: string;
  username: string;
  role: StaffRole;
}

export interface Entry {
  _id: string;
  studentId: PopulatedStudent;
  staffId: StaffRef;
  remarkId: string;
  customRemark?: string;
  severity: Severity;
  escalationLevel: EscalationLevel;
  createdAt: string;
}

export interface Staff {
  _id: string;
  fullName: string;
  username: string;
  role: StaffRole;
  isActive: boolean;
  assignedBatches: string[] | Batch[];
  entryCount?: number;
  lastEntryAt?: string | null;
}

export interface Admin {
  _id: string;
  email: string;
  username: string;
  isActive: boolean;
  createdAt: string;
}

export interface FlaggedStudent extends PopulatedStudent {
  entryCount: number;
  lastEntryAt: string | null;
}

export interface StaffActivity extends Omit<Staff, 'assignedBatches'> {
  entryCount: number;
  lastEntryAt: string | null;
}

export interface AuditLogEntry {
  _id: string;
  action: string;
  actorId: string | null;
  actorUsername: string;
  actorRole: string;
  targetType: string | null;
  targetId: string | null;
  targetName: string | null;
  status: 'success' | 'error';
  details: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalEntries: number;
  flaggedCount: number;
  adminActionCount: number;
  highSeverityCount: number;
}
