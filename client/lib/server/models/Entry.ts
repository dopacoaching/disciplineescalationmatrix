import mongoose, { Document, Schema } from 'mongoose';

export interface IEntry extends Document {
  studentId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  remarkId: string;
  customRemark: string;
  severity: 'low' | 'medium' | 'high';
  escalationLevel: 1 | 2 | 3;
  createdAt: Date;
}

const EntrySchema = new Schema<IEntry>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  remarkId: { type: String, required: true },
  customRemark: { type: String, default: '' },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  escalationLevel: { type: Number, enum: [1, 2, 3], required: true },
  createdAt: { type: Date, default: Date.now },
});

EntrySchema.index({ studentId: 1, createdAt: -1 });
EntrySchema.index({ staffId: 1, createdAt: -1 });
EntrySchema.index({ createdAt: -1 });

export default mongoose.models.Entry || mongoose.model<IEntry>('Entry', EntrySchema);
