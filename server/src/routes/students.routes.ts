import { Router } from 'express';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../controllers/students.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireStaff } from '../middleware/requireStaff';
import { requireBatchAccess } from '../middleware/requireBatchAccess';
import { validateBody } from '../middleware/validateBody';
import { createStudentSchema, updateStudentSchema } from '../validators/student.validator';

const router = Router();

router.get('/', authenticate, getStudents);
router.post('/', authenticate, requireStaff, validateBody(createStudentSchema), requireBatchAccess, createStudent);
router.patch('/:id', authenticate, requireAdmin, validateBody(updateStudentSchema), updateStudent);
router.delete('/:id', authenticate, requireAdmin, deleteStudent);

export default router;
