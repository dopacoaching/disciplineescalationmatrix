import AuditLog from './models/AuditLog';

export interface AuditEvent {
  action: string;
  actorId: string;
  actorUsername: string;
  actorRole: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
}

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  try {
    await AuditLog.create({
      action:        event.action,
      actorId:       event.actorId,
      actorUsername: event.actorUsername,
      actorRole:     event.actorRole,
      targetType:    event.targetType ?? null,
      targetId:      event.targetId   ?? null,
      targetName:    event.targetName ?? null,
    });
  } catch {
    // Audit failure must never break the main request
  }
}
