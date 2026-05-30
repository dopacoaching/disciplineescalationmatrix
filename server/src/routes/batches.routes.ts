import { Router } from 'express';
import { getBatches, createBatch, updateBatch, deleteBatch } from '../controllers/batches.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validateBody';
import { asyncHandler } from '../middleware/asyncHandler';
import { createBatchSchema, updateBatchSchema } from '../validators/batch.validator';

const router = Router();

router.get('/',       authenticate,              asyncHandler(getBatches));
router.post('/',      authenticate, requireAdmin, validateBody(createBatchSchema),  asyncHandler(createBatch));
router.patch('/:id',  authenticate, requireAdmin, validateBody(updateBatchSchema),  asyncHandler(updateBatch));
router.delete('/:id', authenticate, requireAdmin, asyncHandler(deleteBatch));

export default router;
