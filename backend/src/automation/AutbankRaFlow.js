/**
 * Fluxo de consulta de RA no portal Autbank
 */

import { By } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import {
  menuSelectors,
  consultaSelectors,
  gridSelectors,
  searchFormSelectors,
} from './selectors/autbankSelectors.js';
import { sleep } from '../utils/safeWait.js';
import {
  clearInputSafely,
  clickSearchButton,
  waitForSearchResults,
} from './searchHelpers.js';
import { safeExtractText } from '../utils/normalizeText.js';

export class AutbankRaFlow {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Navega até o menu Consulta de RA
   */
  async navigateToConsultaRa() {
    logger.info('Acessando menu Consulta de RA...');
    await this.driver.switchToMainContent();
    await sleep(500);
    await this.driver.waitAndClick(menuSelectors.consultaRaMenu);
    await sleep(800);
    await this.driver.waitAndClick(menuSelectors.consultaRaSubmenu);
    await sleep(2000);
    logger.info('Menu Consulta de RA acessado');
  }

  /**
   * Pesquisa uma RA específica (usa limpeza robusta e clique Pesquisar robusto)
   */
  async searchRa(raNumber) {
    logger.info(`Pesquisando RA ${raNumber}...`);

    await this.driver.switchToConsultaFrame();
    await sleep(500);

    await this.driver.waitAndType(consultaSelectors.numeroRaField, raNumber);
    await sleep(300);

    const driver = this.driver.getDriver();
    await clearInputSafely(driver, searchFormSelectors.periodoAbertura);
    await sleep(500);
    await clickSearchButton(driver);
    await waitForSearchResults(driver);

    logger.info(`Pesquisa da RA ${raNumber} concluída`);
  }

  /**
   * Abre o detalhamento da RA na grid
   */
  async openRaDetail() {
    logger.info('Abrindo detalhes da RA...');
    await this.driver.waitAndClick(gridSelectors.detailButton);
    await sleep(2000);
  }

  /**
   * Verifica se a RA foi encontrada na pesquisa
   */
  async isRaFound() {
    try {
      await this.driver.waitAndFind(gridSelectors.detailButton, 5000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extrai dados do ticket no detalhamento
   */
  async extractRaData(raNumber) {
    const data = {
      numero: raNumber,
      status: null,
      assunto: null,
      descricao: null,
      solicitante: null,
      dataAbertura: null,
      dataFechamento: null,
      datas: {},
      camposExtras: {},
    };

    try {
      const driver = this.driver.getDriver();
      const body = await driver.findElement(By.css('body'));
      const bodyText = await body.getText();

      data.descricao = bodyText ? bodyText.substring(0, 2000) : null;

      const tables = await driver.findElements(By.css('table'));
      for (const table of tables) {
        try {
          const rows = await table.findElements(By.css('tr'));
          for (const row of rows) {
            const cells = await row.findElements(By.css('td'));
            if (cells.length >= 2) {
              const label = await safeExtractText(cells[0]);
              const value = await safeExtractText(cells[1]);
              if (label && value) {
                const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                data.camposExtras[key] = value;
                if (key.includes('status')) data.status = value;
                if (key.includes('assunto')) data.assunto = value;
                if (key.includes('solicitante')) data.solicitante = value;
                if (key.includes('abertura')) data.dataAbertura = value;
                if (key.includes('fechamento')) data.dataFechamento = value;
              }
            }
          }
        } catch {
          // ignora erros em tabelas individuais
        }
      }

      data.datas = {
        abertura: data.dataAbertura,
        fechamento: data.dataFechamento,
      };
    } catch (e) {
      logger.warn('Erro ao extrair dados detalhados:', e.message);
    }

    return data;
  }

  /**
   * Fluxo completo: pesquisa RA e extrai dados
   */
  async consultRa(raNumber) {
    await this.navigateToConsultaRa();
    await this.searchRa(raNumber);

    const found = await this.isRaFound();
    if (!found) {
      return {
        ra: raNumber,
        success: false,
        error: 'RA não encontrada',
      };
    }

    await this.openRaDetail();
    const data = await this.extractRaData(raNumber);

    return {
      ra: raNumber,
      success: true,
      data,
    };
  }
}
