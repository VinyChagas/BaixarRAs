/**
 * Utilitários para manipulação de janelas/abas no Selenium
 */

import { logger } from '../utils/logger.js';

/**
 * Aguarda surgir uma nova janela/aba após um evento (ex: clique em link)
 * @param {WebDriver} driver - instância do Selenium WebDriver
 * @param {string[]} oldHandles - handles das janelas antes do evento
 * @param {number} timeout - timeout em ms
 * @returns {Promise<string[]>} - handles atuais (incluindo a nova)
 */
export async function waitForNewWindow(driver, oldHandles, timeout = 15000) {
  logger.info('Aguardando abertura de nova janela...');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentHandles = await driver.getAllWindowHandles();

    if (currentHandles.length > oldHandles.length) {
      logger.info('Nova janela identificada com sucesso');
      return currentHandles;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  throw new Error(
    `Nova janela não foi aberta dentro do timeout (${timeout}ms). ` +
      `Handles antes: ${oldHandles.length}, handles atuais: ${(await driver.getAllWindowHandles()).length}`
  );
}

/**
 * Aguarda nova janela aparecer (retorna true se apareceu, false se timeout)
 * Não lança erro se não aparecer - útil para fluxo "navegar e verificar se abriu nova janela"
 */
export async function waitForNewWindowOptional(driver, oldHandles, timeout = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentHandles = await driver.getAllWindowHandles();
    if (currentHandles.length > oldHandles.length) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/**
 * Identifica e retorna o handle da nova janela (a que não estava em oldHandles)
 * @param {WebDriver} driver - instância do Selenium WebDriver
 * @param {string[]} oldHandles - handles das janelas antes da abertura
 * @returns {string} - handle da nova janela
 */
export function getNewWindowHandle(currentHandles, oldHandles) {
  const newHandle = currentHandles.find((h) => !oldHandles.includes(h));

  if (!newHandle) {
    throw new Error('Não foi possível identificar o handle da nova janela');
  }

  return newHandle;
}

/**
 * Alterna para a janela mais recente (a que não estava em oldHandles)
 * @param {WebDriver} driver - instância do Selenium WebDriver
 * @param {string[]} oldHandles - handles das janelas antes da abertura
 */
export async function switchToNewestWindow(driver, oldHandles) {
  const currentHandles = await driver.getAllWindowHandles();
  const newHandle = getNewWindowHandle(currentHandles, oldHandles);

  logger.info('Alternando para nova janela');
  await driver.switchTo().window(newHandle);
}
