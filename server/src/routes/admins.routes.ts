import { Router } from 'express';
import { getAdmins, createAdmin, updateAdmin } from '../controllers/admins.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validateBody';
import { createAdminSchema, updateAdminSchema } from '../validators/admin.validator';

const router = Router();

router.get('/', authenticate, requireAdmin, getAdmins);
router.post('/', authenticate, requireAdmin, validateBody(createAdminSchema), createAdmin);
router.patch('/:id', authenticate, requireAdmin, validateBody(updateAdminSchema), updateAdmin);

export default router;
