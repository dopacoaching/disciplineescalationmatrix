import { Request, Response, NextFunction } from 'express';

export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (role !== 'teacher' && role !== 'warden') {
    res.status(403).json({ message: 'Staff access required' });
    return;
  }
  next();
}
