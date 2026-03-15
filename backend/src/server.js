/**
 * Servidor principal da API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getEnvConfig, validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import raRoutes from './routes/raRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

validateEnv();
const config = getEnvConfig();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/ra', raRoutes);
app.use('/api/health', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`Servidor rodando na porta ${config.port}`);
  logger.info(`Modo headless: ${config.headless}`);
});
