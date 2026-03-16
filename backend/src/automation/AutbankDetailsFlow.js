/**
 * Fluxo de extração dos dados gerais da RA (após clicar na Seta)
 * Botão Seta = input type="image" - mesma estratégia robusta do botão de download
 */

import { By } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import { detailSelectors } from './selectors/autbankSelectors.js';
import { safeExtractText } from '../utils/normalizeText.js';

/** Seletores para o input type="image" do botão Seta - ordem de tentativa */
const SETA_SELECTORS = [
  { type: 'css', value: detailSelectors.setaButton.css },
  { type: 'css', value: detailSelectors.setaButton.cssAlt },
  { type: 'xpath', value: detailSelectors.setaButton.xpath },
  { type: 'xpath', value: detailSelectors.setaButton.xpathAbsolute },
  { type: 'css', value: detailSelectors.setaButton.cssBySrc },
  { type: 'xpath', value: detailSelectors.setaButton.xpathBySrc },
  { type: 'css', value: detailSelectors.setaButton.cssByClass },
];

/**
 * Clica no input[type="image"] com estratégia robusta (igual ao download de anexos)
 */
async function clickSetaImageInput(driver, element) {
  logger.info('Aplicando scroll até o botão Seta...');
  await driver.executeScript(
    "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
    element
  );

  const isEnabled = await element.isEnabled();
  const isDisplayed = await element.isDisplayed();
  if (!isEnabled || !isDisplayed) {
    logger.warn('Botão Seta não está habilitado ou visível. Tentando clique via JavaScript.');
  }

  logger.info('Tentando clique normal no input image (Seta)...');
  try {
    await element.click();
    logger.info('Clique normal funcionou.');
    return;
  } catch (e1) {
    logger.info('Clique normal falhou, tentando Actions...');
    try {
      await driver.actions().move({ origin: element }).click().perform();
      logger.info('Clique via Actions funcionou.');
      return;
    } catch (e2) {
      logger.info('Actions falhou, tentando JavaScript click...');
      try {
        await driver.executeScript('arguments[0].click();', element);
        logger.info('Clique via JavaScript funcionou.');
        return;
      } catch (e3) {
        await driver.executeScript(
          "arguments[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));",
          element
        );
        logger.info('Clique via dispatchEvent funcionou.');
      }
    }
  }
}

const CAMPOS_GERAIS = [
  { key: 'numeroRA', selector: detailSelectors.numeroRA },
  { key: 'sistemaOriginal', selector: detailSelectors.sistemaOriginal },
  { key: 'sistemaAtual', selector: detailSelectors.sistemaAtual },
  { key: 'versao', selector: detailSelectors.versao },
  { key: 'dataAbertura', selector: detailSelectors.dataAbertura },
  { key: 'ambiente', selector: detailSelectors.ambiente },
  { key: 'assunto', selector: detailSelectors.assunto },
  { key: 'itemMenu', selector: detailSelectors.itemMenu },
  { key: 'contato', selector: detailSelectors.contato },
  { key: 'situacao', selector: detailSelectors.situacao },
  { key: 'atendente', selector: detailSelectors.atendente },
];

export class AutbankDetailsFlow {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Clica no botão Seta (input type="image") para expandir e exibir os campos gerais
   * Estratégia robusta: múltiplos seletores + clique normal → Actions → JavaScript → dispatchEvent
   */
  async clickSetaExpand() {
    logger.info('Clicando no botão Seta para expandir detalhes...');
    await this.driver.switchToConsultaFrame();

    const driver = this.driver.getDriver();
    let element = null;

    for (const sel of SETA_SELECTORS) {
      try {
        const by = sel.type === 'css' ? By.css(sel.value) : By.xpath(sel.value);
        const els = await driver.findElements(by);
        if (els.length > 0) {
          element = els[0];
          logger.info(`Botão Seta encontrado (${sel.type}): ${sel.value.substring(0, 50)}...`);
          break;
        }
      } catch {
        continue;
      }
    }

    if (!element) {
      throw new Error('Botão Seta não encontrado com nenhum dos seletores.');
    }

    await clickSetaImageInput(driver, element);
    logger.info('Detalhes expandidos');
  }

  /**
   * Localiza elemento com múltiplos seletores (id, css, xpath, xpathAbsolute)
   */
  async findFieldElement(driver, selector) {
    const locators = [
      selector.id && { by: By.id, value: selector.id },
      selector.css && { by: By.css, value: selector.css },
      selector.xpath && { by: By.xpath, value: selector.xpath },
      selector.xpathAbsolute && { by: By.xpath, value: selector.xpathAbsolute },
    ].filter(Boolean);

    for (const { by, value } of locators) {
      try {
        const els = await driver.findElements(by(value));
        if (els.length > 0) return els[0];
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Extrai todos os campos gerais da RA (após expansão)
   * Usa múltiplos seletores por campo para maior robustez
   */
  async extractGeneralData() {
    const driver = this.driver.getDriver();
    const dadosGerais = {};

    for (const { key, selector } of CAMPOS_GERAIS) {
      try {
        const element = await this.findFieldElement(driver, selector);
        dadosGerais[key] = element ? await safeExtractText(element) : null;
      } catch {
        dadosGerais[key] = null;
      }
    }

    return dadosGerais;
  }

  /**
   * Fluxo completo: expande e extrai dados gerais
   */
  async extractRaGeneralData() {
    await this.clickSetaExpand();
    return await this.extractGeneralData();
  }
}
