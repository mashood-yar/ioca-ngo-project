import { Router } from 'express';
import { uploadImage } from '../controllers/upload';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.post('/', requireAuth, requireAdmin, uploadImage);

export default router;
