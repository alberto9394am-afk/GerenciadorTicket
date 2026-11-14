import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

const loginSchema = z.object({
  login: z.string().min(1, 'Login é obrigatório.'),
  senha: z.string().min(1, 'Senha é obrigatória.')
});

const passwordRequestSchema = z.object({
  login: z.string().min(1, 'Login informado é obrigatório.')
});

router.post('/login', validateBody(loginSchema), authController.login);
router.post('/password-request', validateBody(passwordRequestSchema), authController.requestPassword);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
