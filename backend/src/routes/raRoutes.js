/**
 * Rotas de consulta de RAs
 */

import { Router } from 'express';
import { searchRa, exportRa } from '../controllers/raController.js';

const router = Router();

router.post('/search', searchRa);
router.post('/export', exportRa);

export default router;
