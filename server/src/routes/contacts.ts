import { Router } from 'express';
import { createContact, listContacts, getContact, updateContactStatus } from '../controllers/contacts';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', strictLimiter, createContact);
router.get('/', requireAuth, requireAdmin, listContacts);
router.get('/:id', requireAuth, requireAdmin, getContact);
router.patch('/:id/status', requireAuth, requireAdmin, updateContactStatus);

export default router;
