/**
 * Coletor do histórico completo da RA (timeline)
 * FASE 1: Apenas scraping textual - NÃO clica em anexos
 * FASE 3: Navegação e localização de linhas para download de anexos
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

const PAGINATION_WAIT_TIMEOUT = 15000;
const PAGINATION_POLL_MS = 80;
const TIMELINE_POLL_MS = 250;
const TIMELINE_ELEMENT_TIMEOUT_MS = 15000;

/**
 * Executa operação com implicit wait zerado (evita esperas longas de 5-30s)
 */
async function withImplicitZero(driver, operation) {
  let originalImplicit = 5000;
  try {
    const t = await driver.manage().getTimeouts();
    originalImplicit = t.implicit ?? 5000;
    await driver.manage().setTimeouts({ implicit: 0 });
  } catch {}
  try {
    return await operation();
  } finally {
    try {
      await driver.manage().setTimeouts({ implicit: originalImplicit });
    } catch {}
  }
}

/**
 * Aguarda elemento de paginação aparecer (polling 250ms)
 */
async function waitForPaginationElement(driver) {
  const start = Date.now();
  const xpaths = [
    timelinePaginationSelectors.infoText.xpath,
    timelinePaginationSelectors.infoText.xpathAbsolute,
  ];
  while (Date.now() - start < TIMELINE_ELEMENT_TIMEOUT_MS) {
    for (const xpath of xpaths) {
      try {
        const els = await driver.findElements(By.xpath(xpath));
        if (els.length > 0) return els[0];
      } catch {
        continue;
      }
    }
    await sleep(TIMELINE_POLL_MS);
  }
  return null;
}

/**
 * Aguarda botão da timeline aparecer (polling 250ms)
 */
async function findTimelineButtonWithPolling(driver, selectorObj) {
  const start = Date.now();
  const locators = [];
  if (selectorObj.id) locators.push({ by: By.id, value: selectorObj.id });
  if (selectorObj.css) locators.push({ by: By.css, value: selectorObj.css });
  if (selectorObj.xpath) locators.push({ by: By.xpath, value: selectorObj.xpath });
  if (selectorObj.xpathAbsolute) locators.push({ by: By.xpath, value: selectorObj.xpathAbsolute });
  if (locators.length === 0) return null;

  while (Date.now() - start < TIMELINE_ELEMENT_TIMEOUT_MS) {
    for (const { by, value } of locators) {
      try {
        const els = await driver.findElements(by(value));
        if (els.length > 0) return els[0];
      } catch {
        continue;
      }
    }
    await sleep(TIMELINE_POLL_MS);
  }
  return null;
}

/**
 * Gera uniqueKey para deduplicação
 */
function buildUniqueKey(pageNumber, rowIndex, dataHora, tipoSequencia) {
  return `${pageNumber}_${rowIndex}_${dataHora || ''}_${tipoSequencia || ''}`
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Normaliza texto para comparação (trim, lowercase, remove espaços extras)
 */
function normalizeForCompare(text) {
  return (text || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Verifica se dois textos são equivalentes para matching
 */
function textsMatch(a, b) {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na && !nb) return true;
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export class AutbankTimelineCollector {
  constructor(driver) {
    this.driver = driver;
    this._partialHistory = null;
    this._partialTotalPages = 1;
  }

  getPartialHistory() {
    if (!this._partialHistory || this._partialHistory.length === 0) return null;
    return { history: this._partialHistory, totalPages: this._partialTotalPages };
  }

  /**
   * Lê o texto do elemento de paginação (usa polling 250ms, evita implicit wait)
   * Fonte oficial: "Página X de Y"
   */
  async getTimelinePaginationInfo() {
    await this.driver.switchToConsultaFrame();

    const driver = this.driver.getDriver();
    const element = await waitForPaginationElement(driver);

    if (!element) {
      return { currentPage: 1, totalPages: 1, rawText: '' };
    }

    const rawText = await element.getText();
    const { currentPage, totalPages } = parsePaginationText(rawText);
    return { currentPage, totalPages, rawText };
  }

  /**
   * Vai para a última página cronológica (início do atendimento)
   * scroll_3last = início do chamado (polling 250ms)
   */
  async goToLastChronologicalPage() {
    logger.info('Indo para a última página cronológica...');
    await this.driver.switchToConsultaFrame();

    const driver = this.driver.getDriver();
    const el = await findTimelineButtonWithPolling(driver, timelineSelectors.buttonGoToStart);
    if (!el) throw new Error('Botão última página não encontrado');
    await driver.executeScript(
      'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
      el
    );
  }

  /**
   * Avança na sequência: da última página em direção à primeira (polling 250ms)
   * scroll_1previous = "avançar as páginas para acompanhar a sequencia da RA"
   */
  async goToPreviousInSequence() {
    await this.driver.switchToConsultaFrame();

    const driver = this.driver.getDriver();
    let el = await findTimelineButtonWithPolling(driver, timelineSelectors.buttonPreviousPageAnchor);
    if (!el) {
      el = await findTimelineButtonWithPolling(driver, timelineSelectors.buttonPreviousPage);
    }
    if (!el) throw new Error('Botão página anterior não encontrado');
    await driver.executeScript(
      'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
      el
    );
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
   * Navega até uma página específica de forma determinística
   * Nunca assume estado atual - sempre parte de ponto conhecido
   */
  /**
   * Vai para a primeira página (mais recente) com um único clique (polling 250ms)
   */
  async goToFirstPage() {
    await this.driver.switchToConsultaFrame();

    const driver = this.driver.getDriver();
    const el = await findTimelineButtonWithPolling(driver, timelineSelectors.buttonFirstPage);
    if (!el) throw new Error('Botão primeira página não encontrado');
    await driver.executeScript(
      'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
      el
    );
  }

  async goToTimelinePage(targetPage) {
    const driver = this.driver.getDriver();
    return withImplicitZero(driver, async () => {
      await this.driver.switchToConsultaFrame();

      const info = await this.getTimelinePaginationInfo();
      const totalPages = Math.max(1, info.totalPages);

      if (info.currentPage === targetPage) return;

      if (targetPage === 1) {
        await this.goToFirstPage();
        await this.waitForTimelinePage(1);
        return;
      }

      if (targetPage >= totalPages) {
        await this.goToLastChronologicalPage();
        await this.waitForTimelinePage(totalPages);
        return;
      }

      await this.goToLastChronologicalPage();
      await this.waitForTimelinePage(totalPages);

      for (let p = totalPages - 1; p >= targetPage; p--) {
        await this.goToPreviousInSequence();
        await this.waitForTimelinePage(p);
      }
    });
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
   * FASE 1: Coleta completa do histórico - APENAS texto
   * Ordem cronológica: da última página (início) até a primeira (mais recente)
   */
  async collectFullTimelineTextOnly() {
    const driver = this.driver.getDriver();
    return withImplicitZero(driver, async () => {
      logger.info('Iniciando coleta textual completa da RA...');
      this._partialHistory = [];
      this._partialTotalPages = 1;

      await this.driver.switchToConsultaFrame();

      await this.goToLastChronologicalPage();

      const info = await this.getTimelinePaginationInfo();
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
          try {
            await this.goToPreviousInSequence();
            await this.waitForTimelinePage(targetPage);
          } catch (e) {
            logger.warn(`Falha ao ir para página ${targetPage}:`, e.message);
            throw e;
          }
        }
      }

      logger.info(`Histórico completo coletado: ${history.length} itens em ${totalPages} página(s)`);
      return { history, totalPages };
    });
  }

  /**
   * Localiza a linha na página atual que corresponde ao item
   * Valida por rowIndex e campos textuais
   */
  async locateRowInCurrentPage(item) {
    const driver = this.driver.getDriver();
    const trs = await driver.findElements(By.css(timelineSelectors.rows.css));

    const tryByIndex = async () => {
      const idx = (item.rowIndex || 1) - 1;
      if (idx >= 0 && idx < trs.length) {
        const tr = trs[idx];
        const cells = await tr.findElements(By.css('td'));
        if (cells.length >= 6) {
          const dataHora = await safeExtractText(cells[0]);
          const tipoSequencia = await safeExtractText(cells[4]);
          if (textsMatch(dataHora, item.dataHora) && textsMatch(tipoSequencia, item.tipoSequencia)) {
            return tr;
          }
        }
      }
      return null;
    };

    let tr = await tryByIndex();
    if (tr) return tr;

    for (let i = 0; i < trs.length; i++) {
      const cells = await trs[i].findElements(By.css('td'));
      if (cells.length < 6) continue;

      const dataHora = await safeExtractText(cells[0]);
      const analistaContato = await safeExtractText(cells[2]);
      const tipoSequencia = await safeExtractText(cells[4]);
      const descricao = await safeExtractText(cells[5]);

      if (
        textsMatch(dataHora, item.dataHora) &&
        textsMatch(tipoSequencia, item.tipoSequencia) &&
        (textsMatch(analistaContato, item.analistaContato) || textsMatch(descricao, item.descricao))
      ) {
        return trs[i];
      }
    }

    return null;
  }

  /**
   * Abre a tela de anexos para a linha do item (polling 250ms, implicit 0)
   */
  async openAttachmentScreenForRow(item) {
    const driver = this.driver.getDriver();
    return withImplicitZero(driver, async () => {
      const tr = await this.locateRowInCurrentPage(item);
      if (!tr) {
        throw new Error(`Linha não encontrada para item ${item.uniqueKey}`);
      }

      const attachmentInput = await tr.findElement(By.css('td:nth-child(8) input[type="image"]'));
      await driver.executeScript(
        'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
        attachmentInput
      );
    });
  }
}
