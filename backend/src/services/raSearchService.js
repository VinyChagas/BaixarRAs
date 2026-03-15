/**
 * Serviço de busca de RAs - orquestra o fluxo de automação
 */

import { getEnvConfig } from '../config/env.js';
import { AutbankDriver } from '../automation/AutbankDriver.js';
import { AutbankLoginFlow } from '../automation/AutbankLoginFlow.js';
import { AutbankRaFlow } from '../automation/AutbankRaFlow.js';
import { logger } from '../utils/logger.js';

/**
 * Executa busca de múltiplas RAs de forma sequencial
 */
export async function searchRas(ras, options = {}) {
  const config = getEnvConfig();
  const driver = new AutbankDriver({
    browser: config.browser,
    headless: options.headless ?? config.headless,
    timeouts: config.timeouts,
  });

  const results = [];

  try {
    await driver.start();

    const loginFlow = new AutbankLoginFlow(driver);
    await loginFlow.execute(config.autbank.baseUrl, config.autbank.email, config.autbank.password, {
      landingUrl: config.autbank.landingUrl,
      portalLinkSelector: config.autbank.portalLinkSelector,
      useWindowSwitch: config.autbank.useWindowSwitch,
    });

    const raFlow = new AutbankRaFlow(driver);

    for (let i = 0; i < ras.length; i++) {
      const ra = String(ras[i]).trim();
      if (!ra) continue;

      logger.info(`Processando RA ${i + 1}/${ras.length}: ${ra}`);

      try {
        const result = await raFlow.consultRa(ra);
        results.push(result);
      } catch (error) {
        logger.error(`Erro ao processar RA ${ra}:`, error.message);
        try {
          await driver.takeErrorScreenshot(`ra_${ra}`);
        } catch {
          // ignora falha de screenshot
        }
        results.push({
          ra,
          success: false,
          error: error.message || 'Erro desconhecido na automação',
        });
      }
    }
  } catch (error) {
    logger.error('Erro na automação:', error.message);
    try {
      await driver.takeErrorScreenshot('automation_error');
    } catch {
      // ignora
    }
    throw error;
  } finally {
    await driver.quit();
  }

  return results;
}

/**
 * Testa credenciais e conexão com o portal
 */
export async function testConnection(options = {}) {
  const config = getEnvConfig();
  const driver = new AutbankDriver({
    browser: config.browser,
    headless: options.headless ?? config.headless,
    timeouts: config.timeouts,
  });

  try {
    await driver.start();
    const loginFlow = new AutbankLoginFlow(driver);
    await loginFlow.execute(config.autbank.baseUrl, config.autbank.email, config.autbank.password, {
      landingUrl: config.autbank.landingUrl,
      portalLinkSelector: config.autbank.portalLinkSelector,
      useWindowSwitch: config.autbank.useWindowSwitch,
    });
    return { success: true, message: 'Conexão e credenciais válidas' };
  } catch (error) {
    logger.error('Teste de conexão falhou:', error.message);
    try {
      await driver.takeErrorScreenshot('connection_test_error');
    } catch {
      // ignora
    }
    return { success: false, error: error.message };
  } finally {
    await driver.quit();
  }
}
