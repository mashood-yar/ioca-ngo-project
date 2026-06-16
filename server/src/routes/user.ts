import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { 
  getProfile, 
  updateProfile, 
  getMemberships, 
  getDonations, 
  getEventRegistrations,
  getMemberData
} from '../controllers/user';

const router = Router();

// Protect all user routes
router.use(requireAuth);

router.get('/profile/me', getProfile);
router.patch('/profile/me', updateProfile);

router.get('/memberships/me', getMemberships);
router.get('/donations/me', getDonations);
router.get('/event-registrations/me', getEventRegistrations);
router.get('/members/me', getMemberData);

export default router;
