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
 * Para input/textarea usa getAttribute('value'), para outros usa getText()
 */
export async function safeExtractText(element) {
  if (!element) return null;
  try {
    const tagName = await element.getTagName?.().then((t) => t?.toLowerCase?.());
    if (tagName === 'input' || tagName === 'textarea') {
      const value = await element.getAttribute?.('value');
      return normalizeText(value);
    }
    const text = await (element.getText?.() ?? Promise.resolve(null));
    return normalizeText(text);
  } catch {
    return null;
  }
}
