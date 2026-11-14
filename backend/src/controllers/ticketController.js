import db from '../db/connection.js';
import { notificationService } from '../services/notificationService.js';

export const ticketController = {
  list(req, res) {
    const { view, status, prioridade, search } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        t.id,
        t.titulo,
        t.descricao,
        t.status,
        t.prioridade,
        t.criador_id,
        t.tecnico_id,
        t.created_at,
        t.updated_at,
        t.concluido_em,
        u_criador.nome AS criador_nome,
        u_criador.login AS criador_login,
        u_tecnico.nome AS tecnico_nome,
        u_tecnico.login AS tecnico_login
      FROM tickets t
      JOIN users u_criador ON u_criador.id = t.criador_id
      LEFT JOIN users u_tecnico ON u_tecnico.id = t.tecnico_id
      WHERE t.deleted_at IS NULL
    `;

    const params = [];

    // Restrições por perfil
    if (user.perfil === 'usuario') {
      // Usuário só enxerga os próprios tickets
      query += ` AND t.criador_id = ?`;
      params.push(user.id);
    } else if (user.perfil === 'tecnico') {
      // Técnico só enxerga tickets sem técnico OU atribuídos a ele
      if (view === 'unassigned') {
        query += ` AND t.tecnico_id IS NULL`;
      } else if (view === 'mine') {
        query += ` AND t.tecnico_id = ?`;
        params.push(user.id);
      } else {
        query += ` AND (t.tecnico_id IS NULL OR t.tecnico_id = ?)`;
        params.push(user.id);
      }
    } else if (user.perfil === 'admin') {
      // Admin pode filtrar por view se quiser (ex: unassigned ou all)
      if (view === 'unassigned') {
        query += ` AND t.tecnico_id IS NULL`;
      }
    }

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (prioridade) {
      query += ` AND t.prioridade = ?`;
      params.push(prioridade);
    }

    if (search) {
      query += ` AND (t.titulo LIKE ? OR t.descricao LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC`;

    const tickets = db.prepare(query).all(...params);
    return res.json({ tickets });
  },

  getById(req, res) {
    const { id } = req.params;
    const user = req.user;

    const ticket = db.prepare(`
      SELECT 
        t.id,
        t.titulo,
        t.descricao,
        t.status,
        t.prioridade,
        t.criador_id,
        t.tecnico_id,
        t.created_at,
        t.updated_at,
        t.concluido_em,
        u_criador.nome AS criador_nome,
        u_criador.login AS criador_login,
        u_tecnico.nome AS tecnico_nome,
        u_tecnico.login AS tecnico_login
      FROM tickets t
      JOIN users u_criador ON u_criador.id = t.criador_id
      LEFT JOIN users u_tecnico ON u_tecnico.id = t.tecnico_id
      WHERE t.id = ? AND t.deleted_at IS NULL
    `).get(id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    // Validação de acesso ao detalhe
    if (user.perfil === 'usuario' && ticket.criador_id !== user.id) {
      return res.status(403).json({ error: 'Acesso negado a este ticket.' });
    }

    if (user.perfil === 'tecnico' && ticket.tecnico_id !== null && ticket.tecnico_id !== user.id) {
      return res.status(403).json({ error: 'Acesso negado. Este ticket está sob responsabilidade de outro técnico.' });
    }

    // Busca comentários em ordem cronológica
    const comments = db.prepare(`
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
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `).all(id);

    return res.json({
      ticket,
      comments
    });
  },

  create(req, res) {
    const { titulo, descricao, prioridade } = req.body;
    const user = req.user;

    const insertResult = db.prepare(`
      INSERT INTO tickets (titulo, descricao, status, prioridade, criador_id, tecnico_id)
      VALUES (?, ?, 'Aberto', ?, ?, NULL)
    `).run(titulo, descricao, prioridade, user.id);

    const ticketId = insertResult.lastInsertRowid;

    const newTicket = db.prepare(`
      SELECT * FROM tickets WHERE id = ?
    `).get(ticketId);

    // Notifica todos os técnicos ativos (exceto o próprio autor caso seja técnico)
    notificationService.notifyTechniciansOnNewTicket(newTicket, user.id);

    return res.status(201).json({
      message: 'Ticket criado com sucesso.',
      ticket: newTicket
    });
  },

  assume(req, res) {
    const { id } = req.params;
    const user = req.user;

    if (user.perfil !== 'tecnico' && user.perfil !== 'admin') {
      return res.status(403).json({ error: 'Apenas técnicos ou administradores podem assumir tickets.' });
    }

    // Operação atômica conforme especificação:
    // UPDATE ... WHERE tecnico_id IS NULL; o primeiro a assumir fica responsável; se outro já assumiu, retornar 409
    const updateResult = db.prepare(`
      UPDATE tickets
      SET tecnico_id = ?,
          status = 'Em andamento',
          updated_at = datetime('now', 'localtime')
      WHERE id = ? AND tecnico_id IS NULL AND deleted_at IS NULL
    `).run(user.id, id);

    if (updateResult.changes === 0) {
      // Verifica se o ticket existe ou se já possui técnico
      const existing = db.prepare('SELECT id, tecnico_id, deleted_at FROM tickets WHERE id = ?').get(id);
      if (!existing || existing.deleted_at !== null) {
        return res.status(404).json({ error: 'Ticket não encontrado.' });
      }
      return res.status(409).json({ error: 'Este ticket já foi assumido por outro técnico ou não está mais disponível.' });
    }

    const updatedTicket = db.prepare(`
      SELECT t.*, u.nome AS criador_nome 
      FROM tickets t
      JOIN users u ON u.id = t.criador_id
      WHERE t.id = ?
    `).get(id);

    // Notifica o criador do ticket
    notificationService.createNotification({
      usuario_id: updatedTicket.criador_id,
      tipo: 'ticket_assumed',
      mensagem: `O técnico ${user.nome} assumiu o seu ticket #${updatedTicket.id}.`,
      ticket_id: updatedTicket.id,
      actor_id: user.id
    });

    return res.json({
      message: 'Ticket assumido com sucesso.',
      ticket: updatedTicket
    });
  },

  updateStatus(req, res) {
    const { id } = req.params;
    const { status: novoStatus, motivo } = req.body;
    const user = req.user;

    const ticket = db.prepare(`
      SELECT * FROM tickets WHERE id = ? AND deleted_at IS NULL
    `).get(id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    const statusAtual = ticket.status;

    // Regras de transição por perfil
    if (user.perfil === 'usuario') {
      // Usuário só pode interagir no seu próprio ticket
      if (ticket.criador_id !== user.id) {
        return res.status(403).json({ error: 'Você só pode alterar status do seu próprio ticket.' });
      }

      // "Usuário (criador): não altera status livremente. Única exceção, apenas em ticket seu com status Resolvido:
      //  - Confirmar encerramento -> status Fechado
      //  - Reabrir -> status Em andamento, mantendo o mesmo técnico, limpando concluido_em e exigindo um comentário com o motivo"
      if (statusAtual !== 'Resolvido') {
        return res.status(403).json({
          error: 'Usuários só podem confirmar encerramento ou reabrir tickets que estejam com status "Resolvido".'
        });
      }

      if (novoStatus === 'Fechado') {
        db.prepare(`
          UPDATE tickets
          SET status = 'Fechado',
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(id);
      } else if (novoStatus === 'Em andamento') {
        // Reabertura
        if (!motivo || motivo.trim().length === 0) {
          return res.status(422).json({
            error: 'Para reabrir o ticket, é obrigatório informar o motivo no comentário.'
          });
        }

        db.prepare(`
          UPDATE tickets
          SET status = 'Em andamento',
              concluido_em = NULL,
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(id);

        // Registra o comentário com o motivo da reabertura
        db.prepare(`
          INSERT INTO comments (ticket_id, autor_id, mensagem)
          VALUES (?, ?, ?)
        `).run(id, user.id, `Ticket reaberto: ${motivo.trim()}`);
      } else {
        return res.status(403).json({
          error: 'Ação inválida. Você só pode confirmar encerramento (Fechado) ou reabrir (Em andamento).'
        });
      }

      // Notifica o técnico associado, se houver
      if (ticket.tecnico_id) {
        notificationService.createNotification({
          usuario_id: ticket.tecnico_id,
          tipo: 'status_changed',
          mensagem: `O usuário ${user.nome} ${novoStatus === 'Fechado' ? 'encerrou' : 'reabriu'} o ticket #${ticket.id}.`,
          ticket_id: ticket.id,
          actor_id: user.id
        });
      }

      return res.json({
        message: novoStatus === 'Fechado' ? 'Ticket encerrado com sucesso.' : 'Ticket reaberto com sucesso.',
        status: novoStatus
      });
    }

    if (user.perfil === 'tecnico') {
      // Técnico precisa ser o responsável pelo ticket
      if (ticket.tecnico_id !== user.id) {
        return res.status(403).json({
          error: 'Você só pode alterar o status de tickets atribuídos a você.'
        });
      }

      if (statusAtual === 'Fechado') {
        return res.status(403).json({ error: 'Técnicos não podem alterar tickets Fechados.' });
      }

      // "Técnico: só avança status (Aberto -> Em andamento -> Resolvido), nunca retrocede.
      // Confirmar solução/conclusão = mover para Resolvido, registrando concluido_em. Não altera tickets Fechados."
      let valido = false;
      let setConcluido = false;

      if (statusAtual === 'Aberto' && novoStatus === 'Em andamento') {
        valido = true;
      } else if (statusAtual === 'Em andamento' && novoStatus === 'Resolvido') {
        valido = true;
        setConcluido = true;
      }

      if (!valido) {
        return res.status(403).json({
          error: 'Técnico só pode avançar o status (Aberto → Em andamento → Resolvido). Não é permitido retroceder ou fechar diretamente.'
        });
      }

      if (setConcluido) {
        db.prepare(`
          UPDATE tickets
          SET status = 'Resolvido',
              concluido_em = datetime('now', 'localtime'),
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(id);
      } else {
        db.prepare(`
          UPDATE tickets
          SET status = ?,
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(novoStatus, id);
      }

      // Notifica o criador do ticket
      notificationService.createNotification({
        usuario_id: ticket.criador_id,
        tipo: 'status_changed',
        mensagem: `O técnico ${user.nome} atualizou o status do ticket #${ticket.id} para "${novoStatus}".`,
        ticket_id: ticket.id,
        actor_id: user.id
      });

      return res.json({
        message: `Status atualizado para "${novoStatus}".`,
        status: novoStatus
      });
    }

    if (user.perfil === 'admin') {
      // Admin pode alterar livremente para qualquer status
      const validStatuses = ['Aberto', 'Em andamento', 'Resolvido', 'Fechado'];
      if (!validStatuses.includes(novoStatus)) {
        return res.status(422).json({ error: 'Status inválido informado.' });
      }

      let concluidoSql = '';
      if (novoStatus === 'Resolvido') {
        concluidoSql = `, concluido_em = COALESCE(concluido_em, datetime('now', 'localtime'))`;
      } else if (novoStatus === 'Aberto' || novoStatus === 'Em andamento') {
        concluidoSql = `, concluido_em = NULL`;
      }

      db.prepare(`
        UPDATE tickets
        SET status = ?,
            updated_at = datetime('now', 'localtime')
            ${concluidoSql}
        WHERE id = ?
      `).run(novoStatus, id);

      // Notifica o criador
      notificationService.createNotification({
        usuario_id: ticket.criador_id,
        tipo: 'status_changed',
        mensagem: `O administrador alterou o status do ticket #${ticket.id} para "${novoStatus}".`,
        ticket_id: ticket.id,
        actor_id: user.id
      });

      // Notifica o técnico se houver
      if (ticket.tecnico_id) {
        notificationService.createNotification({
          usuario_id: ticket.tecnico_id,
          tipo: 'status_changed',
          mensagem: `O administrador alterou o status do ticket #${ticket.id} para "${novoStatus}".`,
          ticket_id: ticket.id,
          actor_id: user.id
        });
      }

      return res.json({
        message: `Status alterado para "${novoStatus}" com sucesso.`,
        status: novoStatus
      });
    }

    return res.status(403).json({ error: 'Perfil não autorizado.' });
  },

  delete(req, res) {
    const { id } = req.params;
    const user = req.user;

    if (user.perfil !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir tickets.' });
    }

    const ticket = db.prepare('SELECT id, deleted_at FROM tickets WHERE id = ?').get(id);
    if (!ticket || ticket.deleted_at !== null) {
      return res.status(404).json({ error: 'Ticket não encontrado.' });
    }

    // Exclusão lógica: preenche deleted_at; comentários são preservados
    db.prepare(`
      UPDATE tickets
      SET deleted_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(id);

    return res.json({ message: 'Ticket excluído com sucesso.' });
  }
};
