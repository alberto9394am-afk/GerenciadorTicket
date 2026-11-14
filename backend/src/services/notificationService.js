import db from '../db/connection.js';

export const notificationService = {
  createNotification({ usuario_id, tipo, mensagem, ticket_id = null, actor_id = null }) {
    // Regra: Notificação nunca é enviada ao autor da própria ação
    if (actor_id && Number(usuario_id) === Number(actor_id)) {
      return null;
    }

    const stmt = db.prepare(`
      INSERT INTO notifications (usuario_id, tipo, mensagem, ticket_id)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(usuario_id, tipo, mensagem, ticket_id);
  },

  notifyTechniciansOnNewTicket(ticket, actor_id) {
    const tecnicos = db.prepare(`
      SELECT id FROM users
      WHERE perfil = 'tecnico' AND ativo = 1 AND id != ?
    `).all(actor_id || 0);

    const stmt = db.prepare(`
      INSERT INTO notifications (usuario_id, tipo, mensagem, ticket_id)
      VALUES (?, 'ticket_created', ?, ?)
    `);

    for (const t of tecnicos) {
      stmt.run(t.id, `Novo ticket criado: #${ticket.id} - ${ticket.titulo}`, ticket.id);
    }
  },

  notifyAdminsOnPasswordRequest(loginInformado, user_id = null) {
    const admins = db.prepare(`
      SELECT id FROM users
      WHERE perfil = 'admin' AND ativo = 1
    `).all();

    const stmt = db.prepare(`
      INSERT INTO notifications (usuario_id, tipo, mensagem, ticket_id)
      VALUES (?, 'password_request', ?, NULL)
    `);

    const msg = user_id
      ? `Solicitação de troca de senha para o usuário cadastrado: "${loginInformado}"`
      : `Solicitação de troca de senha para o login informado: "${loginInformado}"`;

    for (const admin of admins) {
      stmt.run(admin.id, msg);
    }
  }
};
