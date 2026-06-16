import { Router } from 'express';
import {
  createMember,
  listMembers,
  getMember,
  updateMember,
  deleteMember
} from '../controllers/members';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', requireAuth, requireAdmin, listMembers);
router.get('/:id', requireAuth, requireAdmin, getMember);
router.post('/', requireAuth, requireAdmin, createMember);
router.put('/:id', requireAuth, requireAdmin, updateMember);
router.delete('/:id', requireAuth, requireAdmin, deleteMember);

export default router;
