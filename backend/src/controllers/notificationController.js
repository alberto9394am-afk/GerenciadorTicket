import db from '../db/connection.js';

export const notificationController = {
  list(req, res) {
    const userId = req.user.id;

    // Filtra notificações do usuário, ignorando as de tickets com deleted_at IS NOT NULL
    const notifications = db.prepare(`
      SELECT 
        n.id,
        n.usuario_id,
        n.tipo,
        n.mensagem,
        n.ticket_id,
        n.lida,
        n.created_at
      FROM notifications n
      LEFT JOIN tickets t ON t.id = n.ticket_id
      WHERE n.usuario_id = ?
        AND (n.ticket_id IS NULL OR t.deleted_at IS NULL)
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(userId);

    const unreadCountRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications n
      LEFT JOIN tickets t ON t.id = n.ticket_id
      WHERE n.usuario_id = ? 
        AND n.lida = 0
        AND (n.ticket_id IS NULL OR t.deleted_at IS NULL)
    `).get(userId);

    return res.json({
      unreadCount: unreadCountRow ? unreadCountRow.count : 0,
      notifications
    });
  },

  markAsRead(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = db.prepare('SELECT id FROM notifications WHERE id = ? AND usuario_id = ?').get(id, userId);
    if (!notif) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    db.prepare(`
      UPDATE notifications
      SET lida = 1
      WHERE id = ? AND usuario_id = ?
    `).run(id, userId);

    return res.json({ message: 'Notificação marcada como lida.' });
  },

  markAllAsRead(req, res) {
    const userId = req.user.id;

    db.prepare(`
      UPDATE notifications
      SET lida = 1
      WHERE usuario_id = ? AND lida = 0
    `).run(userId);

    return res.json({ message: 'Todas as notificações foram marcadas como lidas.' });
  }
};
