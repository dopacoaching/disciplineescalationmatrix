import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  // Reuse existing connection (critical in serverless — avoid reconnecting on every invocation)
  if (mongoose.connection.readyState >= 1) return;

  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  console.log(`MongoDB connected → ${mongoose.connection.host}`);
}
