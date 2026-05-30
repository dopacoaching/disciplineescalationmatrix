import { Request, Response, NextFunction } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps async route handlers so unhandled rejections are forwarded to
 * Express's error-handler middleware instead of hanging the request.
 * Without this, a thrown error in an async controller produces no response.
 */
export const asyncHandler = (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
