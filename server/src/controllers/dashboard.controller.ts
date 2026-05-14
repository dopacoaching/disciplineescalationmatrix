import { Request, Response } from 'express';
import {
  buildDateFilter,
  getAdminStats,
  getFlaggedStudentsWithCounts,
  getStaffActivityWithCounts,
} from '../services/dashboard.service';

export async function getStats(req: Request, res: Response): Promise<void> {
  const { fromDate, toDate } = req.query as Record<string, string>;
  const dateFilter = buildDateFilter(fromDate, toDate);
  const stats = await getAdminStats(dateFilter);
  res.json(stats);
}

export async function getFlagged(req: Request, res: Response): Promise<void> {
  const { fromDate, toDate } = req.query as Record<string, string>;
  const dateFilter = buildDateFilter(fromDate, toDate);
  const result = await getFlaggedStudentsWithCounts(dateFilter);
  res.json(result);
}

export async function getStaffActivity(req: Request, res: Response): Promise<void> {
  const { fromDate, toDate } = req.query as Record<string, string>;
  const dateFilter = buildDateFilter(fromDate, toDate);
  const result = await getStaffActivityWithCounts(dateFilter);
  res.json(result);
}
