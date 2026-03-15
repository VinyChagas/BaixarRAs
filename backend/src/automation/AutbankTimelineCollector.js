/**
 * Coletor do histórico completo da RA (timeline)
 * ETAPA 1: Apenas scraping textual - NÃO clica em anexos
 * ETAPA 2: Download de anexos (função separada)
 */

import { By } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import {
  timelineSelectors,
  timelinePaginationSelectors,
} from './selectors/autbankSelectors.js';
import { sleep } from '../utils/safeWait.js';
import { safeExtractText } from '../utils/normalizeText.js';
import { parsePaginationText } from '../utils/paginationUtils.js';

const PAGINATION_WAIT_TIMEOUT = 25000;
const PAGINATION_POLL_MS = 300;

/**
 * Gera uniqueKey para deduplicação
 */
function buildUniqueKey(pageNumber, rowIndex, dataHora, tipoSequencia) {
  return `${pageNumber}_${rowIndex}_${dataHora || ''}_${tipoSequencia || ''}`
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

export class AutbankTimelineCollector {
  constructor(driver) {
    this.driver = driver;
    this._partialHistory = null;
    this._partialTotalPages = 1;
  }

  /**
   * Retorna o histórico parcial coletado até o momento (para salvar em caso de erro)
   */
  getPartialHistory() {
    if (!this._partialHistory || this._partialHistory.length === 0) return null;
    return { history: this._partialHistory, totalPages: this._partialTotalPages };
  }

  /**
   * Lê o texto do elemento de paginação
   */
  async getTimelinePaginationInfo() {
    await this.driver.switchToConsultaFrame();
    await sleep(100);

    const driver = this.driver.getDriver();
    const xpaths = [
      timelinePaginationSelectors.infoText.xpath,
      timelinePaginationSelectors.infoText.xpathAbsolute,
    ];

    let element;
    for (const xpath of xpaths) {
      try {
        element = await driver.findElement(By.xpath(xpath));
        break;
      } catch {
        continue;
      }
    }

    if (!element) {
      return { currentPage: 1, totalPages: 1, rawText: '' };
    }

    const rawText = await element.getText();
    const { currentPage, totalPages } = parsePaginationText(rawText);
    return { currentPage, totalPages, rawText };
  }

  /**
   * Vai para a ÚLTIMA página do histórico (início do chamado).
   * Obrigatório antes de coletar: scroll_3last leva ao início da sequência.
   */
  async goToLastPage() {
    logger.info('Indo para a última página do histórico (início do chamado)...');
    await this.driver.switchToConsultaFrame();
    await sleep(300);

    const tryClick = async () => {
      const el = await this.driver.waitAndFind(timelineSelectors.buttonGoToStart);
      await this.driver.getDriver().executeScript(
        'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
        el
      );
    };

    await tryClick();
    await sleep(1000);
  }

  /**
   * Avança na sequência: da última página em direção à primeira.
   * scroll_1previous = "avançar as páginas para acompanhar a sequencia da RA".
   * Ex: da página 2 vai para página 1.
   */
  async goToPreviousInSequence() {
    await this.driver.switchToConsultaFrame();
    await sleep(200);

    const tryClick = async () => {
      try {
        const el = await this.driver.waitAndFind(timelineSelectors.buttonPreviousPageAnchor);
        await this.driver.getDriver().executeScript(
          'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
          el
        );
      } catch (e1) {
        logger.info('Clique no anchor falhou, tentando img:', e1.message);
        const img = await this.driver.waitAndFind(timelineSelectors.buttonPreviousPage);
        await this.driver.getDriver().executeScript(
          'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
          img
        );
      }
    };

    await tryClick();
    await sleep(1200);
  }

  /**
   * Aguarda a paginação mostrar a página desejada
   */
  async waitForTimelinePage(targetPage) {
    const startTime = Date.now();
    while (Date.now() - startTime < PAGINATION_WAIT_TIMEOUT) {
      const info = await this.getTimelinePaginationInfo();
      if (info.currentPage === targetPage) {
        return true;
      }
      await sleep(PAGINATION_POLL_MS);
    }
    throw new Error(`Timeout aguardando página ${targetPage}`);
  }

  /**
   * Navega até uma página específica (para ETAPA 2 - download de anexos).
   * Fluxo: ir para última página, depois scroll_1previous até a página desejada.
   */
  async goToTimelinePage(targetPage) {
    await this.driver.switchToConsultaFrame();
    await sleep(200);

    let info = await this.getTimelinePaginationInfo();
    const totalPages = Math.max(1, info.totalPages);

    if (targetPage >= totalPages) {
      await this.goToLastPage();
      await this.waitForTimelinePage(totalPages);
      return;
    }

    await this.goToLastPage();
    await this.waitForTimelinePage(totalPages);

    for (let p = totalPages - 1; p >= targetPage; p--) {
      await this.goToPreviousInSequence();
      await this.waitForTimelinePage(p);
    }
  }

  /**
   * Coleta as linhas da página atual (apenas texto, NÃO clica em anexos)
   */
  async collectCurrentTimelinePageRows(pageNumber) {
    const driver = this.driver.getDriver();
    const rows = [];
    const trs = await driver.findElements(By.css(timelineSelectors.rows.css));

    for (let i = 0; i < trs.length; i++) {
      const cells = await trs[i].findElements(By.css('td'));
      if (cells.length < 6) continue;

      const dataHora = await safeExtractText(cells[0]);
      const sistema = await safeExtractText(cells[1]);
      const analistaContato = await safeExtractText(cells[2]);
      const situacao = await safeExtractText(cells[3]);
      const tipoSequencia = await safeExtractText(cells[4]);
      const descricao = await safeExtractText(cells[5]);

      let possuiAnexo = false;
      if (cells.length >= 8) {
        try {
          const anexoInputs = await cells[7].findElements(By.css('input[type="image"]'));
          possuiAnexo = anexoInputs.length > 0;
        } catch {
          possuiAnexo = false;
        }
      }

      const rowIndex = i + 1;
      const uniqueKey = buildUniqueKey(pageNumber, rowIndex, dataHora, tipoSequencia);

      rows.push({
        pageNumber,
        rowIndex,
        uniqueKey,
        dataHora,
        sistema,
        analistaContato,
        situacao,
        tipoSequencia,
        descricao,
        possuiAnexo,
        anexosBaixados: [],
      });
    }

    return rows;
  }

  /**
   * ETAPA 1: Coleta completa do histórico - APENAS texto, sem clicar em anexos
   * Fluxo obrigatório:
   * 1. Ir para a ÚLTIMA página (scroll_3last) = início do chamado
   * 2. Contar páginas e coletar da página atual
   * 3. Usar scroll_1previous para avançar na sequência (última -> primeira)
   */
  async collectFullTimelineTextOnly() {
    logger.info('Iniciando coleta textual completa do histórico...');
    this._partialHistory = [];
    this._partialTotalPages = 1;

    await this.driver.switchToConsultaFrame();
    await sleep(300);

    await this.goToLastPage();

    let info = await this.getTimelinePaginationInfo();
    logger.info(`Paginação atual detectada: ${info.rawText || 'Página 1 de 1'}`);

    const totalPages = Math.max(1, info.totalPages);
    this._partialTotalPages = totalPages;
    const history = [];
    const seenKeys = new Set();

    for (let page = totalPages; page >= 1; page--) {
      const currentInfo = await this.getTimelinePaginationInfo();
      if (currentInfo.currentPage !== page) {
        throw new Error(`Esperado página ${page}, mas está em ${currentInfo.currentPage}`);
      }

      logger.info(`Coletando dados da página ${page} de ${totalPages}...`);
      const rows = await this.collectCurrentTimelinePageRows(page);

      for (const row of rows) {
        if (seenKeys.has(row.uniqueKey)) continue;
        seenKeys.add(row.uniqueKey);
        history.push(row);
      }

      this._partialHistory = [...history];

      logger.info(`Página ${page} coletada com ${rows.length} linhas.`);

      if (page > 1) {
        const targetPage = page - 1;
        const maxRetries = 2;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            logger.info(`Avançando para página ${targetPage} (tentativa ${attempt}/${maxRetries})...`);
            await this.goToPreviousInSequence();
            await this.waitForTimelinePage(targetPage);
            break;
          } catch (e) {
            if (attempt === maxRetries) throw e;
            logger.warn(`Falha ao ir para página ${targetPage}, tentando novamente:`, e.message);
            await sleep(1000);
          }
        }
      }
    }

    logger.info(`Histórico completo coletado: ${history.length} itens em ${totalPages} página(s)`);
    return { history, totalPages };
  }

  /**
   * Abre o painel de anexos da linha (para ETAPA 2)
   */
  async openAttachmentByRow(rowIndex) {
    const selector = `#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0 tbody tr:nth-child(${rowIndex}) td:nth-child(8) input`;
    await this.driver.waitAndClick({ css: selector });
    await sleep(1000);
  }
}
