import { Router } from 'express';
import { getAdmins, createAdmin, updateAdmin } from '../controllers/admins.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validateBody';
import { asyncHandler } from '../middleware/asyncHandler';
import { createAdminSchema, updateAdminSchema } from '../validators/admin.validator';

const router = Router();

router.get('/',      authenticate, requireAdmin, asyncHandler(getAdmins));
router.post('/',     authenticate, requireAdmin, validateBody(createAdminSchema),  asyncHandler(createAdmin));
router.patch('/:id', authenticate, requireAdmin, validateBody(updateAdminSchema),  asyncHandler(updateAdmin));

export default router;
