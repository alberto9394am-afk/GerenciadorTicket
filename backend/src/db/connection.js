import { config } from '../config.js';

let dbInstance = null;

// Tenta carregar better-sqlite3 primeiro; se falhar, utiliza node:sqlite nativo
try {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const db = new BetterSqlite3(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  dbInstance = db;
  console.log('[DB] Conectado com sucesso usando better-sqlite3:', config.dbPath);
} catch (err) {
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const rawDb = new DatabaseSync(config.dbPath);
    rawDb.exec('PRAGMA journal_mode = WAL;');
    rawDb.exec('PRAGMA foreign_keys = ON;');

    dbInstance = {
      exec(sql) {
        return rawDb.exec(sql);
      },
      pragma(pragmaStr) {
        return rawDb.exec(`PRAGMA ${pragmaStr};`);
      },
      prepare(sql) {
        const stmt = rawDb.prepare(sql);
        return {
          run(...params) {
            const res = stmt.run(...params);
            return {
              changes: Number(res.changes ?? 0),
              lastInsertRowid: Number(res.lastInsertRowid ?? 0)
            };
          },
          get(...params) {
            return stmt.get(...params) || null;
          },
          all(...params) {
            return stmt.all(...params) || [];
          }
        };
      }
    };
    console.log('[DB] Conectado com sucesso usando SQLite nativo (node:sqlite):', config.dbPath);
  } catch (fallbackErr) {
    console.error('[DB] Erro ao conectar ao SQLite:', fallbackErr);
    throw fallbackErr;
  }
}

export function getDb() {
  return dbInstance;
}
export default dbInstance;
