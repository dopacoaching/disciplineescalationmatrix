import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // In development, log the full stack for easy debugging.
  // In production, log only name + message to avoid leaking internal details in Vercel logs.
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  }
  res.status(500).json({ message: 'Internal server error' });
}
