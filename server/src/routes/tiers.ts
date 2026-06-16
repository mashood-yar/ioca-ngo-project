import { Router } from 'express';
import { listTiers } from '../controllers/tiers';

const router = Router();

router.get('/', listTiers);

export default router;
