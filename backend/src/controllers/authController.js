/**
 * Controller de autenticação - teste de conexão
 */

import { testConnection } from '../services/raSearchService.js';

export async function testAuth(req, res, next) {
  try {
    const headless = req.body?.headless ?? undefined;
    const result = await testConnection({ headless });

    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(401).json({ success: false, error: result.error });
    }
  } catch (error) {
    next(error);
  }
}
