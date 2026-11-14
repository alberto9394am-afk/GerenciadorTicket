import crypto from 'crypto';
import db from '../db/connection.js';

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido.' });
  }

  const rawToken = authHeader.split(' ')[1];
  if (!rawToken) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const tokenHash = hashToken(rawToken);

  // Busca sessão ativa e não expirada
  const session = db.prepare(`
    SELECT 
      s.id as session_id,
      s.user_id,
      s.expires_at,
      s.revoked,
      u.nome,
      u.login,
      u.perfil,
      u.ativo
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.revoked = 0 AND datetime(s.expires_at) > datetime('now', 'localtime')
  `).get(tokenHash);

  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida, revogada ou expirada. Efetue login novamente.' });
  }

  if (session.ativo !== 1) {
    // Revoga sessões caso o usuário esteja inativo
    db.prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?').run(session.user_id);
    return res.status(401).json({ error: 'Usuário inativo. Acesso negado.' });
  }

  req.user = {
    id: session.user_id,
    nome: session.nome,
    login: session.login,
    perfil: session.perfil,
    ativo: session.ativo
  };
  req.sessionId = session.session_id;
  req.tokenHash = tokenHash;

  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!allowedRoles.includes(req.user.perfil)) {
      return res.status(403).json({
        error: `Acesso negado. Esta operação exige perfil: ${allowedRoles.join(' ou ')}.`
      });
    }

    next();
  };
}
