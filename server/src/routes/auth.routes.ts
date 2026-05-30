import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminLogin, staffLogin, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validateBody';
import { asyncHandler } from '../middleware/asyncHandler';
import { adminLoginSchema, staffLoginSchema } from '../validators/auth.validator';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/admin-login', loginLimiter, validateBody(adminLoginSchema), asyncHandler(adminLogin));
router.post('/login',       loginLimiter, validateBody(staffLoginSchema),  asyncHandler(staffLogin));
router.post('/logout',      authenticate, asyncHandler(logout));
router.get('/me',           authenticate, asyncHandler(me));

export default router;
