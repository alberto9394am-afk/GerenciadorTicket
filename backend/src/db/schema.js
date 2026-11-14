import db from './connection.js';

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      login TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      perfil TEXT CHECK(perfil IN ('admin', 'tecnico', 'usuario')) NOT NULL,
      ativo INTEGER DEFAULT 1 NOT NULL,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      status TEXT CHECK(status IN ('Aberto', 'Em andamento', 'Resolvido', 'Fechado')) DEFAULT 'Aberto' NOT NULL,
      prioridade TEXT CHECK(prioridade IN ('baixa', 'media', 'alta')) NOT NULL,
      criador_id INTEGER NOT NULL REFERENCES users(id),
      tecnico_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT (datetime('now', 'localtime')) NOT NULL,
      updated_at DATETIME DEFAULT (datetime('now', 'localtime')) NOT NULL,
      concluido_em DATETIME,
      deleted_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      autor_id INTEGER NOT NULL REFERENCES users(id),
      mensagem TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL REFERENCES users(id),
      tipo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      ticket_id INTEGER REFERENCES tickets(id),
      lida INTEGER DEFAULT 0 NOT NULL,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked INTEGER DEFAULT 0 NOT NULL,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login_informado TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      status TEXT CHECK(status IN ('pendente', 'resolvida')) DEFAULT 'pendente' NOT NULL,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_tecnico ON tickets(tecnico_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_criador ON tickets(criador_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_deleted ON tickets(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(usuario_id, lida);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash, revoked);
  `);

  console.log('[DB] Tabelas e índices criados/verificados com sucesso.');
}
