// Single source of truth for audit-log action metadata, shared by the
// audit-log GET route, its export route, and the per-student report's
// "Admin Actions" section — so labels and the filterable category list
// can't drift out of sync between reports.

export const AUDIT_ACTION_CATEGORIES = new Set(['auth', 'staff', 'admin', 'batch', 'student', 'entry']);

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'auth.login':         'Login',
  'auth.logout':        'Logout',
  'auth.login_failed':  'Login failed',
  'staff.create':       'Staff created',
  'staff.update':       'Staff updated',
  'staff.deactivate':   'Staff deactivated',
  'staff.reactivate':   'Staff reactivated',
  'admin.create':       'Admin created',
  'admin.update':       'Admin updated',
  'admin.deactivate':   'Admin deactivated',
  'admin.reactivate':   'Admin reactivated',
  'batch.create':       'Batch created',
  'batch.update':       'Batch updated',
  'batch.delete':       'Batch deleted',
  'student.create':     'Student created',
  'student.update':     'Student updated',
  'student.delete':     'Student deleted',
  'student.clearFlag':  'Escalation flag cleared',
  'entry.create':       'Entry created',
  'entry.delete':       'Entry deleted',
};

// Actions relevant to a single student's history (used by the per-student
// PDF/Excel report's "Admin Actions" section).
export const STUDENT_AUDIT_ACTIONS = ['student.update', 'student.delete', 'student.clearFlag', 'entry.delete'];
