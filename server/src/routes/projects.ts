import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projects';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../schemas/projects';

const router = Router();

// Public — list all projects
router.get('/', listProjects);

// Public — get a single project
router.get('/:id', getProject);

// Admin — create a project
router.post('/', requireAuth, requireAdmin, validate(createProjectSchema), createProject);

// Admin — update a project
router.put('/:id', requireAuth, requireAdmin, validate(updateProjectSchema), updateProject);

// Admin — delete a project
router.delete('/:id', requireAuth, requireAdmin, deleteProject);

export default router;
