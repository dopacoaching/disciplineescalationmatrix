import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  name: string;
  isArchived: boolean;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const BatchSchema = new Schema<IBatch>({
  name: { type: String, required: true },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
});

export default mongoose.model<IBatch>('Batch', BatchSchema);
