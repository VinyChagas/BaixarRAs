/**
 * Fluxo de extração dos dados gerais da RA (após clicar na Seta)
 */

import { logger } from '../utils/logger.js';
import { detailSelectors } from './selectors/autbankSelectors.js';
import { sleep } from '../utils/safeWait.js';
import { safeExtractText } from '../utils/normalizeText.js';

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
   * Clica no botão Seta para expandir e exibir os campos gerais
   */
  async clickSetaExpand() {
    logger.info('Clicando no botão Seta para expandir detalhes...');
    await this.driver.switchToConsultaFrame();
    await this.driver.waitAndClick(detailSelectors.setaButton);
    logger.info('Detalhes expandidos');
  }

  /**
   * Extrai todos os campos gerais da RA (após expansão)
   */
  async extractGeneralData() {
    const dadosGerais = {};

    for (const { key, selector } of CAMPOS_GERAIS) {
      try {
        const element = await this.driver.waitAndFind(selector, 3000);
        const text = await safeExtractText(element);
        dadosGerais[key] = text;
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
