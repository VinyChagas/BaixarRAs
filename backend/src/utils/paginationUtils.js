/**
 * Utilitários para parse do texto de paginação
 */

/**
 * Faz parse do texto de paginação (ex: "Página 1 de 6", "Pagina 2 de 3")
 * @param {string} text - Texto bruto do elemento
 * @returns {{ currentPage: number, totalPages: number }}
 */
export function parsePaginationText(text) {
  if (!text || typeof text !== 'string') {
    return { currentPage: 1, totalPages: 1 };
  }

  const normalized = text.trim();
  const regex = /p[aáà]gina\s*(\d+)\s+de\s+(\d+)/i;
  const match = normalized.match(regex);

  if (match) {
    const currentPage = parseInt(match[1], 10);
    const totalPages = parseInt(match[2], 10);
    return {
      currentPage: isNaN(currentPage) ? 1 : Math.max(1, currentPage),
      totalPages: isNaN(totalPages) ? 1 : Math.max(1, totalPages),
    };
  }

  return { currentPage: 1, totalPages: 1 };
}
