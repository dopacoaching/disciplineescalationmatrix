import { Router } from 'express';
import { getStaff, createStaff, updateStaff, getStaffEntries } from '../controllers/staff.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validateBody';
import { createStaffSchema, updateStaffSchema } from '../validators/staff.validator';

const router = Router();

router.get('/', authenticate, requireAdmin, getStaff);
router.post('/', authenticate, requireAdmin, validateBody(createStaffSchema), createStaff);
router.patch('/:id', authenticate, requireAdmin, validateBody(updateStaffSchema), updateStaff);
router.get('/:id/entries', authenticate, requireAdmin, getStaffEntries);

export default router;
