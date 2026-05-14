import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../src/config/db';
import app from '../src/app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  // Cast: VercelRequest/Response are compatible with Express req/res
  return app(req as any, res as any);
}
