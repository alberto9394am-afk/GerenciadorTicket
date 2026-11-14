import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: process.env.PORT || 3001,
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'ticket.db'),
  sessionDurationHours: 8
};
