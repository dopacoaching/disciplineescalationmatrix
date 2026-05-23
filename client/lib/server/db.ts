import mongoose from 'mongoose';

interface MongoError { code: number; keyPattern: Record<string, number> }
export function isDuplicateKeyError(err: unknown): err is MongoError {
  return typeof err === 'object' && err !== null && (err as MongoError).code === 11000;
}

let _connectPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (!_connectPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    _connectPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 })
      .catch(err => { _connectPromise = null; throw err; });
  }
  await _connectPromise;
}
