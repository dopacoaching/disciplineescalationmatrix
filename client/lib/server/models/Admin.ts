import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  username: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId | null;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, unique: true, required: true, lowercase: true },
  username: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
});

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
