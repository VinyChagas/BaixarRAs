/**
 * Salvamento do histórico em JSON e TXT
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Salva o histórico em JSON
 */
export function saveTimelineJson(ra, history, totalPages, raDir) {
  const payload = {
    ra,
    totalPages,
    collectedAt: new Date().toISOString(),
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

/**
 * Salva o histórico em TXT legível
 */
export function saveTimelineTxt(ra, history, raDir) {
  const lines = [];

  for (const item of history) {
    lines.push(`[Página ${item.pageNumber} | Linha ${item.rowIndex}]`);
    lines.push(`Data/Hora: ${item.dataHora || '-'}`);
    lines.push(`Sistema: ${item.sistema || '-'}`);
    lines.push(`Analista/Contato: ${item.analistaContato || '-'}`);
    lines.push(`Situação: ${item.situacao || '-'}`);
    lines.push(`Tipo Sequência: ${item.tipoSequencia || '-'}`);
    lines.push(`Descrição: ${item.descricao || '-'}`);
    lines.push(`Possui anexo: ${item.possuiAnexo ? 'Sim' : 'Não'}`);
    lines.push('');
  }

  const filePath = path.join(raDir, `ra_${ra}_historico.txt`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  logger.info('Histórico completo salvo em TXT.');
  return filePath;
}
