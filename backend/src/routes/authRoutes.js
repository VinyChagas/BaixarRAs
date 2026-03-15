/**
 * Rotas de autenticação
 */

import { Router } from 'express';
import { testAuth } from '../controllers/authController.js';

const router = Router();

router.post('/test', testAuth);

export default router;
