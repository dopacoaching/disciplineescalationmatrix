import mongoose from 'mongoose';

let _connectPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (!_connectPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    _connectPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
  }
  await _connectPromise;
}
