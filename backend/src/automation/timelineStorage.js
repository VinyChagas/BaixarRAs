/**
 * Salvamento do histórico em JSON
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Atualiza o item do histórico com os arquivos baixados
 * @param {Object} item - Item do histórico (referência)
 * @param {string[]} files - Lista de caminhos relativos dos arquivos (ex: ["anexos/arquivo.pdf"])
 */
export function updateHistoryItemWithDownloadedFiles(item, files) {
  if (!item) return;
  item.anexosBaixados = item.anexosBaixados || [];
  item.anexosBaixados.push(...(files || []));
}

/**
 * Salva o histórico em JSON (inclui dadosGerais para compor o arquivo completo)
 * @param {Object} [dadosGerais] - Dados gerais da RA (numeroRA, sistemaOriginal, etc.)
 */
export function saveTimelineJson(ra, history, totalPages, raDir, dadosGerais = null) {
  const payload = {
    ra,
    totalPages,
    collectedAt: new Date().toISOString(),
    ...(dadosGerais && { dadosGerais }),
    history: history.map((item) => ({
      pageNumber: item.pageNumber,
      rowIndex: item.rowIndex,
      uniqueKey: item.uniqueKey,
      dataHora: item.dataHora,
      sistema: item.sistema,
      analistaContato: item.analistaContato,
      situacao: item.situacao,
      tipoSequencia: item.tipoSequencia,
      descricao: item.descricao,
      possuiAnexo: item.possuiAnexo,
      anexosBaixados: item.anexosBaixados || [],
    })),
  };

  const filePath = path.join(raDir, `ra_${ra}_historico.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  logger.info('Histórico completo salvo em JSON.');
  return filePath;
}
