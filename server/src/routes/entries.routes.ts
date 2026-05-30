import { Router } from 'express';
import { getEntries, createEntry, deleteEntry } from '../controllers/entries.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireStaff } from '../middleware/requireStaff';
import { validateBody } from '../middleware/validateBody';
import { asyncHandler } from '../middleware/asyncHandler';
import { createEntrySchema } from '../validators/entry.validator';

const router = Router();

router.get('/',       authenticate,              asyncHandler(getEntries));
router.post('/',      authenticate, requireStaff, validateBody(createEntrySchema), asyncHandler(createEntry));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(deleteEntry));

export default router;
