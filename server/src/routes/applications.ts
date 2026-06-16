import { Router } from 'express';
import { createApplication, getMyApplication, deleteMyApplication } from '../controllers/applications';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/', requireAuth, createApplication);
router.get('/me', requireAuth, getMyApplication);
router.delete('/me', requireAuth, deleteMyApplication);

export default router;
