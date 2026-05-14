import { Router } from 'express';
import { getStats, getFlagged, getStaffActivity } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/stats', authenticate, requireAdmin, getStats);
router.get('/flagged', authenticate, requireAdmin, getFlagged);
router.get('/staff-activity', authenticate, requireAdmin, getStaffActivity);

export default router;
