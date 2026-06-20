import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  username: string;
  fullName?: string;
  passwordHash: string;
  isActive: boolean;
  // Super admins have full access to every batch and can manage other admins.
  // Scoped admins (isSuperAdmin === false) are limited to assignedBatches and
  // cannot manage admins. Existing admins (field absent) are treated as super.
  isSuperAdmin: boolean;
  assignedBatches: mongoose.Types.ObjectId[];
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId | null;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, unique: true, required: true, lowercase: true },
  username: { type: String, unique: true, required: true, lowercase: true },
  fullName: { type: String },
  passwordHash: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isSuperAdmin: { type: Boolean, default: true },
  assignedBatches: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
});

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
