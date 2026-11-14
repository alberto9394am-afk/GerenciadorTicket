import bcrypt from 'bcryptjs';
import db from './connection.js';

export function runSeed() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count === 0) {
    console.log('[Seed] Tabela de usuários vazia. Criando usuário admin inicial...');
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    
    db.prepare(`
      INSERT INTO users (nome, login, senha_hash, perfil, ativo)
      VALUES (?, ?, ?, ?, ?)
    `).run('Administrador', 'admin', adminPasswordHash, 'admin', 1);

    // Também criamos um técnico e um usuário de demonstração para facilitar os testes imediatos
    const tecnicoHash = bcrypt.hashSync('tecnico123', 10);
    db.prepare(`
      INSERT INTO users (nome, login, senha_hash, perfil, ativo)
      VALUES (?, ?, ?, ?, ?)
    `).run('Técnico Suporte', 'tecnico', tecnicoHash, 'tecnico', 1);

    const usuarioHash = bcrypt.hashSync('usuario123', 10);
    db.prepare(`
      INSERT INTO users (nome, login, senha_hash, perfil, ativo)
      VALUES (?, ?, ?, ?, ?)
    `).run('Usuário Solicitante', 'usuario', usuarioHash, 'usuario', 1);

    console.log('[Seed] Usuários criados com sucesso:');
    console.log('       - Admin:   login: admin   / senha: admin123');
    console.log('       - Técnico: login: tecnico / senha: tecnico123');
    console.log('       - Usuário: login: usuario / senha: usuario123');
  }
}
