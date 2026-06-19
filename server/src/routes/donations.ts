import { Router } from 'express';
import { 
  createDonation, 
  listDonations,
  getDonation,
  updateDonationStatus, 
  uploadScreenshot, 
  deleteDonation 
} from '../controllers/donations';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', strictLimiter, createDonation);
router.get('/', requireAuth, requireAdmin, listDonations);
router.get('/:id', requireAuth, requireAdmin, getDonation);
router.patch('/:id/status', requireAuth, requireAdmin, updateDonationStatus);
router.post('/:id/screenshot', requireAuth, requireAdmin, uploadScreenshot);
router.delete('/:id', requireAuth, requireAdmin, deleteDonation);

export default router;
