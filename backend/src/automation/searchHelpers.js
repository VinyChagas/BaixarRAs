/**
 * Helpers robustos para o fluxo de pesquisa
 */

import { By } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import { searchFormSelectors, gridSelectors } from './selectors/autbankSelectors.js';
import { sleep } from '../utils/safeWait.js';

/**
 * Limpa o campo de forma robusta (CTRL+A, BACKSPACE, JS, validação)
 */
export async function clearInputSafely(driver, selectorObj, timeout = 15000) {
  const locators = _buildLocators(selectorObj);
  let element;

  for (const { by, value } of locators) {
    try {
      element = await driver.wait(
        (d) => d.findElement(by(value)),
        timeout,
        `Campo não encontrado: ${value}`
      );
      break;
    } catch {
      continue;
    }
  }

  if (!element) {
    throw new Error('Campo Período de abertura não encontrado');
  }

  logger.info('Limpando campo Período de abertura...');

  await element.click();
  await sleep(200);

  await element.sendKeys('\u0001'); // CTRL+A
  await sleep(100);
  await element.sendKeys('\u0008'); // BACKSPACE
  await sleep(100);

  let value = await element.getAttribute('value');
  if (value && value.trim() !== '') {
    await driver.executeScript(
      `
      arguments[0].value = '';
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
      arguments[0].blur();
    `,
      element
    );
    await sleep(200);
  }

  value = await element.getAttribute('value');
  if (value && value.trim() !== '') {
    throw new Error(
      `Campo Período de abertura não foi limpo corretamente. Valor restante: "${value}"`
    );
  }

  logger.info('Campo Período de abertura limpo com sucesso.');
}

/**
 * Clica no botão Pesquisar de forma robusta (click, Actions, JS)
 */
export async function clickSearchButton(driver, timeout = 15000) {
  const selectorObj = searchFormSelectors.pesquisarButton;
  const locators = _buildLocators(selectorObj);
  let element;

  for (const { by, value } of locators) {
    try {
      element = await driver.wait(
        (d) => d.findElement(by(value)),
        timeout,
        `Botão Pesquisar não encontrado: ${value}`
      );
      break;
    } catch {
      continue;
    }
  }

  if (!element) {
    throw new Error('Botão Pesquisar não encontrado');
  }

  logger.info('Clicando no botão Pesquisar...');

  await sleep(500);

  try {
    await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
    await sleep(300);
  } catch {}

  try {
    await element.click();
  } catch (e1) {
    try {
      const { Actions } = await import('selenium-webdriver');
      const actions = driver.actions({ async: true });
      await actions.move({ origin: element }).click().perform();
    } catch (e2) {
      await driver.executeScript('arguments[0].click();', element);
    }
  }

  logger.info('Resultados da pesquisa carregados com sucesso.');
}

/**
 * Aguarda a grid de resultado carregar
 */
export async function waitForSearchResults(driver, timeout = 15000) {
  const { until } = await import('selenium-webdriver');
  const locators = _buildLocators(gridSelectors.detailButton);

  for (const { by, value } of locators) {
    try {
      await driver.wait(until.elementLocated(by(value)), timeout);
      await sleep(2000);
      return true;
    } catch {
      continue;
    }
  }

  throw new Error('Grid de resultado da pesquisa não carregou dentro do timeout');
}

function _buildLocators(selectorObj) {
  const locators = [];
  if (selectorObj.id) locators.push({ by: By.id, value: selectorObj.id });
  if (selectorObj.css) locators.push({ by: By.css, value: selectorObj.css });
  if (selectorObj.xpath) locators.push({ by: By.xpath, value: selectorObj.xpath });
  if (selectorObj.xpathAbsolute) locators.push({ by: By.xpath, value: selectorObj.xpathAbsolute });
  return locators.length > 0 ? locators : [{ by: By.id, value: JSON.stringify(selectorObj) }];
}
