/**
 * Driver principal para controle do navegador Selenium
 * Gerencia ciclo de vida, waits, retries e screenshots
 */

import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import { logger } from '../utils/logger.js';
import { sleep } from '../utils/safeWait.js';
import {
  waitForNewWindow,
  switchToNewestWindow,
  waitForNewWindowOptional,
} from './windowUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 150;

export class AutbankDriver {
  constructor(config) {
    this.config = config;
    this.driver = null;
    this.screenshotsDir = path.join(__dirname, '../../screenshots');
  }

  /**
   * Inicia o navegador
   * @param {string} [downloadDir] - Diretório para downloads (Chrome prefs)
   */
  async start(downloadDir) {
    logger.info('Iniciando navegador...');

    const isEdge = this.config.browser === 'edge';
    const OptionsClass = isEdge ? edge.Options : chrome.Options;
    const options = new OptionsClass();
    if (this.config.headless) {
      options.addArguments('--headless=new', '--window-size=1695,1273');
    } else {
      options.addArguments('--window-size=1695,1273');
    }

    if (downloadDir) {
      const absPath = path.resolve(downloadDir).replace(/\\/g, '/');
      try {
        options.setUserPreferences({
          'download.default_directory': absPath,
          'download.prompt_for_download': false,
          'download.directory_upgrade': true,
          'safebrowsing.enabled': true,
        });
        logger.info(`Download configurado para: ${absPath}`);
      } catch (e) {
        logger.warn('Não foi possível configurar prefs de download:', e.message);
      }
    }

    const builder = new Builder()
      .forBrowser(this.config.browser)
      .setCapability('pageLoadStrategy', 'eager');
    if (isEdge) {
      builder.setEdgeOptions(options);
    } else {
      builder.setChromeOptions(options);
    }
    this.driver = await builder.build();

    this.driver.manage().setTimeouts({
      pageLoad: this.config.timeouts.pageLoad,
      implicit: this.config.timeouts.implicit,
    });

    logger.info('Navegador iniciado com sucesso');
    return this.driver;
  }

  /**
   * Encerra o navegador
   */
  async quit() {
    if (this.driver) {
      logger.info('Encerrando navegador...');
      await this.driver.quit().catch((e) => logger.warn('Erro ao encerrar navegador:', e.message));
      this.driver = null;
    }
  }

  /**
   * Localiza elemento com retry e wait explícito
   */
  async waitAndFind(selectorObj, timeout = this.config.timeouts.element) {
    const locators = this._buildLocators(selectorObj);
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      for (let i = 0; i < locators.length; i++) {
        const { by, value } = locators[i];
        try {
          const element = await this.driver.wait(
            until.elementLocated(by(value)),
            timeout,
            `Elemento não encontrado: ${value}`
          );
          return element;
        } catch (e) {
          lastError = e;
          if (attempt < MAX_RETRIES || i < locators.length - 1) {
          }
        }
      }
    }
    throw lastError || new Error('Elemento não encontrado após retries');
  }

  /**
   * Clica em elemento com retry
   */
  async waitAndClick(selectorObj, timeout = this.config.timeouts.element) {
    const element = await this.waitAndFind(selectorObj, timeout);
    await this.driver.executeScript('arguments[0].click();', element);
  }

  /**
   * Digita em campo com retry
   */
  async waitAndType(selectorObj, text, timeout = this.config.timeouts.element) {
    const element = await this.waitAndFind(selectorObj, timeout);
    await element.clear();
    await element.sendKeys(text || '');
  }

  /**
   * Limpa campo de forma segura
   */
  async clearInputSafely(selectorObj, timeout = this.config.timeouts.element) {
    const element = await this.waitAndFind(selectorObj, timeout);
    await element.clear();
    await element.sendKeys('');
  }

  /**
   * Troca para frame por índice
   */
  async switchToFrame(frameIndex) {
    const frames = await this.driver.findElements(By.css('iframe, frame'));
    if (frames.length > frameIndex) {
      await this.driver.switchTo().frame(frames[frameIndex]);
      logger.debug(`Trocado para frame ${frameIndex}`);
    }
  }

  /**
   * Volta para o contexto principal
   */
  async switchToMainContent() {
    await this.driver.switchTo().defaultContent();
    logger.debug('Retornado ao contexto principal');
  }

  /**
   * Entra no frame da consulta (índice 0 conforme fluxo original)
   */
  async switchToConsultaFrame() {
    await this.switchToFrame(0);
  }

  /**
   * Tira screenshot em caso de erro
   */
  async takeErrorScreenshot(prefix = 'error') {
    try {
      if (!fs.existsSync(this.screenshotsDir)) {
        fs.mkdirSync(this.screenshotsDir, { recursive: true });
      }
      const filename = `${prefix}_${Date.now()}.png`;
      const filepath = path.join(this.screenshotsDir, filename);
      const screenshot = await this.driver.takeScreenshot();
      fs.writeFileSync(filepath, screenshot, 'base64');
      logger.info(`Screenshot salvo: ${filepath}`);
      return filepath;
    } catch (e) {
      logger.warn('Falha ao salvar screenshot:', e.message);
      return null;
    }
  }

  /**
   * Navega para URL
   */
  async navigate(url) {
    await this.driver.get(url);
  }

  /**
   * Retorna os handles das janelas atuais
   */
  async getWindowHandles() {
    return this.driver.getAllWindowHandles();
  }

  /**
   * Aguarda surgir uma nova janela/aba
   */
  async waitForNewWindow(oldHandles, timeout = this.config.timeouts.element) {
    return waitForNewWindow(this.driver, oldHandles, timeout);
  }

  /**
   * Alterna para a janela mais recente (nova janela aberta)
   */
  async switchToNewestWindow(oldHandles) {
    return switchToNewestWindow(this.driver, oldHandles);
  }

  /**
   * Navega para URL e, se uma nova janela abrir, alterna para ela.
   * O portal Autbank pode abrir em nova janela ao navegar.
   */
  async navigateAndSwitchIfNewWindow(url, waitForNewWindowMs = 5000) {
    logger.info('Capturando janelas atuais antes da navegação');
    const oldHandles = await this.getWindowHandles();

    logger.info('Navegando para o portal...');
    await this.navigate(url);

    const newWindowOpened = await waitForNewWindowOptional(
      this.driver,
      oldHandles,
      waitForNewWindowMs
    );

    if (newWindowOpened) {
      logger.info('Nova janela identificada - alternando para ela');
      await this.switchToNewestWindow(oldHandles);
    } else {
      logger.info('Portal carregou na mesma janela');
    }
  }

  /**
   * Clica em elemento e alterna para a nova janela/aba aberta.
   * Usa waits explícitos e não assume foco automático.
   */
  async clickAndSwitchToNewWindow(selectorObj, timeout = this.config.timeouts.element) {
    const oldHandles = await this.getWindowHandles();
    logger.info('Capturando janelas atuais antes do clique');

    await this.waitAndClick(selectorObj, timeout);
    logger.info('Clicando no link do portal');

    await this.waitForNewWindow(oldHandles, timeout);
    await this.switchToNewestWindow(oldHandles);
  }

  /**
   * Aguarda elemento estar visível e habilitado
   */
  async waitForElementVisibleAndEnabled(selectorObj, timeout = this.config.timeouts.element) {
    const element = await this.waitAndFind(selectorObj, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    return element;
  }

  /**
   * Define o diretório de download (Chrome/Edge)
   * Usa setDownloadPath nativo do driver ou CDP como fallback.
   */
  async setDownloadPath(dirPath) {
    try {
      if (typeof this.driver.setDownloadPath === 'function') {
        await this.driver.setDownloadPath(dirPath);
      } else {
        const normalized = path.resolve(dirPath).replace(/\\/g, '/');
        await this.driver.executeCdpCommand('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: normalized,
        });
      }
      logger.debug(`Download path definido: ${dirPath}`);
    } catch (e) {
      logger.warn('Não foi possível definir download path:', e.message);
    }
  }

  /**
   * Retorna o driver para uso direto
   */
  getDriver() {
    return this.driver;
  }

  _buildLocators(selectorObj) {
    const locators = [];
    if (selectorObj.id) {
      locators.push({ by: By.id, value: selectorObj.id });
    }
    if (selectorObj.css) {
      locators.push({ by: By.css, value: selectorObj.css });
    }
    if (selectorObj.xpath) {
      locators.push({ by: By.xpath, value: selectorObj.xpath });
    }
    if (selectorObj.xpathAbsolute) {
      locators.push({ by: By.xpath, value: selectorObj.xpathAbsolute });
    }
    return locators.length > 0 ? locators : [{ by: By.id, value: JSON.stringify(selectorObj) }];
  }
}
