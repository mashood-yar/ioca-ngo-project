import { Router } from 'express';
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent
} from '../controllers/events';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../schemas/events';

const router = Router();

// Public — list all events
router.get('/', listEvents);

// Public — get a single event
router.get('/:id', getEvent);

// Admin — create an event
router.post('/', requireAuth, requireAdmin, validate(createEventSchema), createEvent);

// Admin — update an event
router.put('/:id', requireAuth, requireAdmin, validate(updateEventSchema), updateEvent);

// Admin — delete an event
router.delete('/:id', requireAuth, requireAdmin, deleteEvent);

// User — register for an event
router.post('/:id/register', requireAuth, registerForEvent);

// User — unregister from an event
router.delete('/:id/unregister', requireAuth, unregisterFromEvent);

export default router;
