import { Router } from 'express';
import { z } from 'zod';
import { userController } from '../controllers/userController.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.'),
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres.'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres.'),
  perfil: z.enum(['admin', 'tecnico', 'usuario'], {
    errorMap: () => ({ message: 'Perfil deve ser admin, tecnico ou usuario.' })
  })
});

const resetPasswordSchema = z.object({
  nova_senha: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.')
});

const toggleStatusSchema = z.object({
  ativo: z.union([z.number(), z.boolean()])
});

// Todas as rotas de gerenciamento de usuários são exclusivas para Admin
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/', userController.list);
router.post('/', validateBody(createUserSchema), userController.create);
router.patch('/:id/status', validateBody(toggleStatusSchema), userController.toggleStatus);
router.post('/:id/reset-password', validateBody(resetPasswordSchema), userController.resetPassword);

// Solicitações de troca de senha
router.get('/password-requests/list', userController.listPasswordRequests);
router.patch('/password-requests/:id/resolve', userController.resolvePasswordRequest);

export default router;
