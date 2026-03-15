/**
 * Tratamento global de erros da API
 */

import { logger } from './logger.js';

export function errorHandler(err, req, res, next) {
  logger.error('Erro na requisição:', err.message);
  logger.debug('Stack:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: ${req.method} ${req.path}`,
  });
}
