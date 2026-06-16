import { Router } from 'express';
import { listApplications, updateApplicationStatus } from '../controllers/adminApplications';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', listApplications);
router.patch('/:id/status', updateApplicationStatus);

export default router;
