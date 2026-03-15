/**
 * Utilitários para normalização de texto extraído
 */

/**
 * Remove espaços extras e quebras de linha
 */
export function normalizeText(text) {
  if (text == null || text === '') return null;
  return String(text).replace(/\s+/g, ' ').trim() || null;
}

/**
 * Extrai texto de um elemento de forma segura (suporta Promises do Selenium)
 */
export async function safeExtractText(element) {
  if (!element) return null;
  try {
    const text = await (element.getText?.() ?? Promise.resolve(null));
    return normalizeText(text);
  } catch {
    return null;
  }
}
