/**
 * Helpers para agrupamento de itens com anexo
 * FASE 2: Agrupamento dos itens com anexo por página
 */

import { logger } from '../utils/logger.js';

/**
 * Extrai apenas os itens que possuem anexo do histórico
 * @param {Array} history - Histórico completo coletado
 * @returns {Array} Itens com possuiAnexo === true
 */
export function extractItemsWithAttachments(history) {
  const items = (history || []).filter((item) => item.possuiAnexo === true);
  logger.info(`Itens com anexo identificados: ${items.length}`);
  return items;
}

/**
 * Agrupa itens com anexo por número de página
 * Ordem: páginas em ordem decrescente (6, 5, 4, 3, 2, 1)
 * para processar do início cronológico ao mais recente
 *
 * @param {Array} itemsWithAttachments - Lista de itens que possuem anexo
 * @returns {Object} { "6": [item1, item2], "5": [item3], ... }
 */
export function groupAttachmentItemsByPage(itemsWithAttachments) {
  const groups = {};

  for (const item of itemsWithAttachments) {
    const page = String(item.pageNumber ?? 1);
    if (!groups[page]) {
      groups[page] = [];
    }
    groups[page].push(item);
  }

  const pageNumbers = Object.keys(groups)
    .map(Number)
    .sort((a, b) => b - a);

  logger.info('Agrupando anexos por página...');
  for (const p of pageNumbers) {
    logger.info(`  Página ${p}: ${groups[p].length} item(ns) com anexo`);
  }

  return { groups, pageNumbers };
}
