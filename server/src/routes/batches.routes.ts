import { Router } from 'express';
import { getBatches, createBatch, updateBatch, deleteBatch } from '../controllers/batches.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validateBody } from '../middleware/validateBody';
import { createBatchSchema, updateBatchSchema } from '../validators/batch.validator';

const router = Router();

router.get('/', authenticate, getBatches);
router.post('/', authenticate, requireAdmin, validateBody(createBatchSchema), createBatch);
router.patch('/:id', authenticate, requireAdmin, validateBody(updateBatchSchema), updateBatch);
router.delete('/:id', authenticate, requireAdmin, deleteBatch);

export default router;
