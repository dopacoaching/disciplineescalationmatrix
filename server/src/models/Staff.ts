import mongoose, { Document, Schema } from 'mongoose';

export interface IStaff extends Document {
  fullName: string;
  username: string;
  passwordHash: string;
  role: 'teacher' | 'warden';
  assignedBatches: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const StaffSchema = new Schema<IStaff>({
  fullName: { type: String, required: true },
  username: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'warden'], required: true },
  assignedBatches: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
});

export default mongoose.model<IStaff>('Staff', StaffSchema);
