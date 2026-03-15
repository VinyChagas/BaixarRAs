/**
 * Controller de consulta de RAs
 */

import fs from 'fs';
import path from 'path';
import { searchRas } from '../services/raSearchService.js';
import { exportRas } from '../services/raExportService.js';

export async function searchRa(req, res, next) {
  try {
    const { ras } = req.body;
    const headless = req.body?.headless ?? undefined;

    if (!ras || !Array.isArray(ras)) {
      return res.status(400).json({
        success: false,
        error: 'Campo "ras" é obrigatório e deve ser um array',
      });
    }

    const rasFiltered = ras
      .map((r) => String(r).trim())
      .filter((r) => r.length > 0);

    if (rasFiltered.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma RA válida informada',
      });
    }

    const results = await searchRas(rasFiltered, { headless });

    res.json({
      success: true,
      total: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportRa(req, res, next) {
  try {
    const { ras, outputDir, headless } = req.body;

    if (!ras || !Array.isArray(ras)) {
      return res.status(400).json({
        success: false,
        error: 'Campo "ras" é obrigatório e deve ser um array',
      });
    }

    const rasFiltered = ras.map((r) => String(r).trim()).filter((r) => r.length > 0);
    if (rasFiltered.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma RA válida informada',
      });
    }

    if (!outputDir || typeof outputDir !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Campo "outputDir" é obrigatório (caminho absoluto da pasta de destino)',
      });
    }

    const normalizedDir = path.resolve(outputDir.trim());
    try {
      if (!fs.existsSync(normalizedDir)) {
        fs.mkdirSync(normalizedDir, { recursive: true });
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: `Não foi possível criar a pasta: ${e.message}`,
      });
    }

    const results = await exportRas(rasFiltered, normalizedDir, { headless });

    res.json({
      success: true,
      total: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
}
