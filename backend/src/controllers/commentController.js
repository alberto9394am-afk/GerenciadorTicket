import db from '../db/connection.js';
import { notificationService } from '../services/notificationService.js';

export const commentController = {
  add(req, res) {
    const { id: ticketId } = req.params;
    const { mensagem } = req.body;
    const user = req.user;

    const ticket = db.prepare(`
      SELECT * FROM tickets WHERE id = ? AND deleted_at IS NULL
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    // Regra: "Comentários são bloqueados em tickets Fechados (exceto Admin)"
    if (ticket.status === 'Fechado' && user.perfil !== 'admin') {
      return res.status(403).json({
        error: 'Este ticket está fechado. Apenas administradores podem adicionar comentários em tickets fechados.'
      });
    }

    // Permissões por perfil:
    // - Usuário só comenta nos seus tickets
    if (user.perfil === 'usuario' && ticket.criador_id !== user.id) {
      return res.status(403).json({ error: 'Você só pode comentar em seus próprios tickets.' });
    }

    // - Técnico só comenta em tickets sob sua responsabilidade (precisa assumir antes)
    if (user.perfil === 'tecnico') {
      if (ticket.tecnico_id !== user.id) {
        return res.status(403).json({
          error: 'Você só pode comentar em tickets que já assumiu sob sua responsabilidade.'
        });
      }
    }

    // Insere comentário
    const insertResult = db.prepare(`
      INSERT INTO comments (ticket_id, autor_id, mensagem)
      VALUES (?, ?, ?)
    `).run(ticketId, user.id, mensagem.trim());

    // Atualiza data de modificação do ticket
    db.prepare(`
      UPDATE tickets
      SET updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(ticketId);

    const newComment = db.prepare(`
      SELECT 
        c.id,
        c.ticket_id,
        c.autor_id,
        c.mensagem,
        c.created_at,
        u.nome AS autor_nome,
        u.perfil AS autor_perfil
      FROM comments c
      JOIN users u ON u.id = c.autor_id
      WHERE c.id = ?
    `).get(insertResult.lastInsertRowid);

    // Envio de notificações conforme especificação:
    // - Usuário recebe notificação quando Técnico/Admin comenta em seu ticket
    if (user.id !== ticket.criador_id) {
      notificationService.createNotification({
        usuario_id: ticket.criador_id,
        tipo: 'new_comment',
        mensagem: `Novo comentário de ${user.nome} (${user.perfil}) no ticket #${ticket.id}.`,
        ticket_id: ticket.id,
        actor_id: user.id
      });
    }

    // - Técnico recebe notificação quando o Usuário comenta em ticket sob sua responsabilidade
    if (user.perfil === 'usuario' && ticket.tecnico_id && ticket.tecnico_id !== user.id) {
      notificationService.createNotification({
        usuario_id: ticket.tecnico_id,
        tipo: 'new_comment',
        mensagem: `O solicitante adicionou um novo comentário no ticket #${ticket.id}.`,
        ticket_id: ticket.id,
        actor_id: user.id
      });
    }

    return res.status(201).json({
      message: 'Comentário adicionado com sucesso.',
      comment: newComment
    });
  }
};
