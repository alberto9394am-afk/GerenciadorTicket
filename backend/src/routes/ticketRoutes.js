import { Router } from 'express';
import { z } from 'zod';
import { ticketController } from '../controllers/ticketController.js';
import { commentController } from '../controllers/commentController.js';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

const createTicketSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres.').max(150, 'Título muito longo.'),
  descricao: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres.'),
  prioridade: z.enum(['baixa', 'media', 'alta'], {
    errorMap: () => ({ message: 'Prioridade deve ser baixa, media ou alta.' })
  })
});

const updateStatusSchema = z.object({
  status: z.enum(['Aberto', 'Em andamento', 'Resolvido', 'Fechado'], {
    errorMap: () => ({ message: 'Status deve ser Aberto, Em andamento, Resolvido ou Fechado.' })
  }),
  motivo: z.string().optional()
});

const addCommentSchema = z.object({
  mensagem: z.string().min(1, 'Comentário não pode estar vazio.')
});

// Todas as rotas de ticket exigem autenticação
router.use(authMiddleware);

router.get('/', ticketController.list);
router.post('/', validateBody(createTicketSchema), ticketController.create);
router.get('/:id', ticketController.getById);
router.post('/:id/assume', requireRole('tecnico', 'admin'), ticketController.assume);
router.patch('/:id/status', validateBody(updateStatusSchema), ticketController.updateStatus);
router.post('/:id/comments', validateBody(addCommentSchema), commentController.add);
router.delete('/:id', requireRole('admin'), ticketController.delete);

export default router;
