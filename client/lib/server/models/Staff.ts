import mongoose, { Document, Schema } from 'mongoose';

export interface IStaff extends Document {
  fullName: string;
  username: string;
  passwordHash: string;
  role: 'teacher' | 'warden';
  assignedBatches: mongoose.Types.ObjectId[];
  isActive: boolean;
  // Campus in-charge staff may permanently remove students (and their data).
  isCampusIncharge: boolean;
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
  isCampusIncharge: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
});

export default mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);
