import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';

const router = Router();

// Relatórios disponíveis apenas para Admin
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/stats', reportController.getStats);

export default router;
