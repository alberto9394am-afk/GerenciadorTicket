import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initSchema } from './db/schema.js';
import { runSeed } from './db/seed.js';

import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Middlewares globais
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Inicializa banco de dados e seed inicial
try {
  initSchema();
  runSeed();
} catch (error) {
  console.error('[Startup Error] Falha ao inicializar o banco de dados:', error);
  process.exit(1);
}

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Tratamento de rotas inexistentes (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint da API não encontrado.' });
});

// Middleware centralizado de tratamento de erros
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erro interno do servidor.'
  });
});

app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`  Backend rodando em http://localhost:${config.port}`);
  console.log(`===============================================`);
});
