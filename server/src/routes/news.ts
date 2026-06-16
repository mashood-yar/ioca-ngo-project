import { Router } from 'express';
import {
  createNews,
  listNews,
  getNews,
  updateNews,
  deleteNews,
} from '../controllers/news';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createNewsSchema, updateNewsSchema } from '../schemas/news';

const router = Router();

// Public — list all news articles
router.get('/', listNews);

// Public — get a single news article
router.get('/:id', getNews);

// Admin — create a news article
router.post('/', requireAuth, requireAdmin, validate(createNewsSchema), createNews);

// Admin — update a news article
router.put('/:id', requireAuth, requireAdmin, validate(updateNewsSchema), updateNews);

// Admin — delete a news article
router.delete('/:id', requireAuth, requireAdmin, deleteNews);

export default router;
