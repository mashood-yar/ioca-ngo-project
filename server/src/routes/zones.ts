import { Router } from 'express';
import {
  createZone,
  listZones,
  getZone,
  updateZone,
  deleteZone
} from '../controllers/zones';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', listZones);
router.get('/:id', getZone);
router.post('/', requireAuth, requireAdmin, createZone);
router.put('/:id', requireAuth, requireAdmin, updateZone);
router.delete('/:id', requireAuth, requireAdmin, deleteZone);

export default router;
