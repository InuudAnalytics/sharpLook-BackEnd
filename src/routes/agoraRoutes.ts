import { Router } from 'express';
import { generateToken, renewToken } from '../controllers/agoraController';

const router = Router();

router.post('/generate-token', generateToken);
router.post('/renew-token', renewToken);

export default router;
