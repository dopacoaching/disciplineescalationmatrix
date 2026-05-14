import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actorId: mongoose.Types.ObjectId;
  actorUsername: string;
  actorRole: string;
  targetType: string | null;
  targetId: mongoose.Types.ObjectId | null;
  targetName: string | null;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action:        { type: String, required: true },
  actorId:       { type: Schema.Types.ObjectId, required: true },
  actorUsername: { type: String, required: true },
  actorRole:     { type: String, required: true },
  targetType:    { type: String, default: null },
  targetId:      { type: Schema.Types.ObjectId, default: null },
  targetName:    { type: String, default: null },
  createdAt:     { type: Date, default: Date.now },
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day TTL

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
