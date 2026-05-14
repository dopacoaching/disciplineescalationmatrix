import { Request, Response, NextFunction } from 'express';

export function requireBatchAccess(req: Request, res: Response, next: NextFunction): void {
  const batchId = req.params.batchId || req.body.batchId;
  const assignedBatches = req.user?.assignedBatches || [];

  if (!batchId) {
    next();
    return;
  }

  const hasAccess = assignedBatches.some(
    (id) => id.toString() === batchId.toString()
  );

  if (!hasAccess) {
    res.status(403).json({ message: 'Access denied to this batch' });
    return;
  }
  next();
}
