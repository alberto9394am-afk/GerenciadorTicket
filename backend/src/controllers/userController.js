import bcrypt from 'bcryptjs';
import db from '../db/connection.js';

export const userController = {
  list(req, res) {
    const users = db.prepare(`
      SELECT id, nome, login, perfil, ativo, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    return res.json({ users });
  },

  create(req, res) {
    const { nome, login, senha, perfil } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(login) = LOWER(?)').get(login);
    if (existing) {
      return res.status(409).json({ error: 'Já existe um usuário cadastrado com este login.' });
    }

    const senhaHash = bcrypt.hashSync(senha, 10);

    const result = db.prepare(`
      INSERT INTO users (nome, login, senha_hash, perfil, ativo)
      VALUES (?, ?, ?, ?, 1)
    `).run(nome, login, senhaHash, perfil);

    const newUser = db.prepare(`
      SELECT id, nome, login, perfil, ativo, created_at
      FROM users
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      user: newUser
    });
  },

  toggleStatus(req, res) {
    const { id } = req.params;
    const { ativo } = req.body; // 1 ou 0
    const targetUserId = Number(id);

    if (targetUserId === req.user.id && ativo === 0) {
      return res.status(400).json({ error: 'O administrador não pode desativar a si próprio.' });
    }

    const user = db.prepare('SELECT id, ativo FROM users WHERE id = ?').get(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const novoAtivo = ativo === 1 || ativo === true ? 1 : 0;

    db.prepare(`
      UPDATE users
      SET ativo = ?
      WHERE id = ?
    `).run(novoAtivo, targetUserId);

    // "Usuários inativos não conseguem logar e têm sessões revogadas ao serem desativados"
    if (novoAtivo === 0) {
      db.prepare(`
        UPDATE sessions
        SET revoked = 1
        WHERE user_id = ?
      `).run(targetUserId);
    }

    return res.json({
      message: `Usuário ${novoAtivo === 1 ? 'ativado' : 'desativado'} com sucesso.`,
      ativo: novoAtivo
    });
  },

  resetPassword(req, res) {
    const { id } = req.params;
    const { nova_senha } = req.body;
    const targetUserId = Number(id);

    const user = db.prepare('SELECT id, login FROM users WHERE id = ?').get(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaHash = bcrypt.hashSync(nova_senha, 10);

    db.prepare(`
      UPDATE users
      SET senha_hash = ?
      WHERE id = ?
    `).run(senhaHash, targetUserId);

    // Revoga sessões antigas por segurança
    db.prepare(`
      UPDATE sessions
      SET revoked = 1
      WHERE user_id = ?
    `).run(targetUserId);

    // Se houver solicitações de senha pendentes para este usuário ou login, marca como resolvida
    db.prepare(`
      UPDATE password_requests
      SET status = 'resolvida'
      WHERE (user_id = ? OR LOWER(login_informado) = LOWER(?)) AND status = 'pendente'
    `).run(targetUserId, user.login);

    return res.json({ message: 'Senha redefinida com sucesso.' });
  },

  listPasswordRequests(req, res) {
    const requests = db.prepare(`
      SELECT 
        pr.id,
        pr.login_informado,
        pr.user_id,
        pr.status,
        pr.created_at,
        u.nome AS usuario_nome,
        u.perfil AS usuario_perfil,
        u.ativo AS usuario_ativo
      FROM password_requests pr
      LEFT JOIN users u ON u.id = pr.user_id
      ORDER BY pr.created_at DESC
    `).all();

    return res.json({ requests });
  },

  resolvePasswordRequest(req, res) {
    const { id } = req.params;

    const reqItem = db.prepare('SELECT id, status FROM password_requests WHERE id = ?').get(id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    db.prepare(`
      UPDATE password_requests
      SET status = 'resolvida'
      WHERE id = ?
    `).run(id);

    return res.json({ message: 'Solicitação marcada como resolvida.' });
  }
};
