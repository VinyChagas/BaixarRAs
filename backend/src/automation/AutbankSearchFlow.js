/**
 * Fluxo de pesquisa e abertura de RA no portal Autbank
 */

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

export class AutbankSearchFlow {
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
   * Pesquisa uma RA específica
   * Fluxo: preencher RA -> limpar Período de abertura (robusto) -> clicar Pesquisar (robusto) -> aguardar resultado
   */
  async searchRa(raNumber) {
    logger.info(`Pesquisando RA ${raNumber}...`);
    await this.driver.switchToConsultaFrame();
    await sleep(500);

    await this.driver.waitAndType(consultaSelectors.numeroRaField, raNumber);
    await sleep(300);

    const driver = this.driver.getDriver();
    try {
      await clearInputSafely(driver, searchFormSelectors.periodoAbertura);
      await sleep(500);
      await clickSearchButton(driver);
      await waitForSearchResults(driver);
    } catch (e) {
      await this.driver.takeErrorScreenshot('pesquisa_falhou');
      throw new Error(`Falha na pesquisa da RA ${raNumber}: ${e.message}`);
    }

    logger.info(`Pesquisa da RA ${raNumber} concluída`);
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
   * Abre o detalhamento da RA na grid
   */
  async openRaDetail() {
    logger.info('Abrindo detalhes da RA...');
    await this.driver.waitAndClick(gridSelectors.detailButton);
    await sleep(2000);
  }

  /**
   * Fluxo completo: navega, pesquisa e abre a RA
   */
  async searchAndOpenRa(raNumber) {
    await this.navigateToConsultaRa();
    await this.searchRa(raNumber);

    const found = await this.isRaFound();
    if (!found) {
      return { found: false };
    }

    await this.openRaDetail();
    return { found: true };
  }
}
