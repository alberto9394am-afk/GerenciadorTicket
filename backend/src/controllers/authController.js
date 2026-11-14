import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { hashToken } from '../middlewares/auth.js';
import { notificationService } from '../services/notificationService.js';
import { config } from '../config.js';

export const authController = {
  login(req, res) {
    const { login, senha } = req.body;

    const user = db.prepare(`
      SELECT * FROM users WHERE LOWER(login) = LOWER(?)
    `).get(login);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    if (user.ativo !== 1) {
      return res.status(401).json({ error: 'Usuário inativo. Contate o administrador.' });
    }

    const passwordMatch = bcrypt.compareSync(senha, user.senha_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Gera token aleatório de 64 caracteres hex (256 bits)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Calcula expiração em 8 horas
    const expiresAt = new Date(Date.now() + config.sessionDurationHours * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    db.prepare(`
      INSERT INTO sessions (user_id, token_hash, expires_at, revoked)
      VALUES (?, ?, ?, 0)
    `).run(user.id, tokenHash, expiresAt);

    return res.json({
      message: 'Login realizado com sucesso.',
      token: rawToken,
      user: {
        id: user.id,
        nome: user.nome,
        login: user.login,
        perfil: user.perfil
      }
    });
  },

  logout(req, res) {
    if (req.sessionId) {
      db.prepare('UPDATE sessions SET revoked = 1 WHERE id = ?').run(req.sessionId);
    }
    return res.json({ message: 'Logout realizado com sucesso.' });
  },

  me(req, res) {
    return res.json({ user: req.user });
  },

  requestPassword(req, res) {
    const { login } = req.body;

    const user = db.prepare(`
      SELECT id, login, ativo FROM users WHERE LOWER(login) = LOWER(?)
    `).get(login);

    const userId = user ? user.id : null;

    db.prepare(`
      INSERT INTO password_requests (login_informado, user_id, status)
      VALUES (?, ?, 'pendente')
    `).run(login, userId);

    // Notifica os administradores
    notificationService.notifyAdminsOnPasswordRequest(login, userId);

    // Resposta sempre genérica para evitar enumeração de logins
    return res.json({
      message: 'Solicitação registrada com sucesso. Se o login existir, os administradores foram notificados.'
    });
  }
};
