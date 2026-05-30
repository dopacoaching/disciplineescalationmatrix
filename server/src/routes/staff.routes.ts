import { Router } from 'express';
import { getStaff, createStaff, updateStaff, getStaffEntries } from '../controllers/staff.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validateBody';
import { asyncHandler } from '../middleware/asyncHandler';
import { createStaffSchema, updateStaffSchema } from '../validators/staff.validator';

const router = Router();

router.get('/',           authenticate, requireAdmin, asyncHandler(getStaff));
router.post('/',          authenticate, requireAdmin, validateBody(createStaffSchema),  asyncHandler(createStaff));
router.patch('/:id',      authenticate, requireAdmin, validateBody(updateStaffSchema),  asyncHandler(updateStaff));
router.get('/:id/entries',authenticate, requireAdmin, asyncHandler(getStaffEntries));

export default router;
