/**
 * Utilitários para waits seguros
 */

/**
 * Aguarda um tempo em milissegundos
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
