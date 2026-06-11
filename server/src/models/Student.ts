import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  registerNumber: string;
  fullName: string;
  batchId: mongoose.Types.ObjectId;
  currentEscalationLevel: 1 | 2 | 3;
  lastClearedAt: Date | null;
  lastAdminActionNote: string;
  lastClearedByUsername: string;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const StudentSchema = new Schema<IStudent>({
  registerNumber: { type: String, required: true },
  fullName: { type: String, required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  currentEscalationLevel: { type: Number, enum: [1, 2, 3], default: 1 },
  lastClearedAt: { type: Date, default: null },
  lastAdminActionNote: { type: String, default: '' },
  lastClearedByUsername: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
});

StudentSchema.index({ registerNumber: 1, batchId: 1 }, { unique: true });

export default mongoose.model<IStudent>('Student', StudentSchema);
