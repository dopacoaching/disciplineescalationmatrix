import { Router } from 'express';
import { getStats, getFlagged, getStaffActivity } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/stats',          authenticate, requireAdmin, asyncHandler(getStats));
router.get('/flagged',        authenticate, requireAdmin, asyncHandler(getFlagged));
router.get('/staff-activity', authenticate, requireAdmin, asyncHandler(getStaffActivity));

export default router;
