import AuditLog from './models/AuditLog';

export interface AuditEvent {
  action: string;
  actorId?: string;        // omit when actor identity is unconfirmed (e.g. unknown username)
  actorUsername: string;
  actorRole: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  status?: 'success' | 'error';
  details?: string;
  batchIds?: string[];
}

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  try {
    await AuditLog.create({
      action:        event.action,
      actorId:       event.actorId   ?? null,
      actorUsername: event.actorUsername,
      actorRole:     event.actorRole,
      targetType:    event.targetType ?? null,
      targetId:      event.targetId   ?? null,
      targetName:    event.targetName ?? null,
      status:        event.status     ?? 'success',
      details:       event.details    ?? null,
      batchIds:      event.batchIds   ?? [],
    });
  } catch {
    // Audit failure must never break the main request
  }
}
