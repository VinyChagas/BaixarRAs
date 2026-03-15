/**
 * Download de anexos da RA - Tela "Consulta de Anexos"
 * Trata explicitamente o input[type="image"] como elemento de download
 * FASE 3: Download dos anexos agrupados por página
 */

import path from 'path';
import { By } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import {
  ensureDirectoryExists,
  waitForDownloadToFinish,
  listNewFilesSince,
  moveDownloadedFileIfNeeded,
  getFileSnapshot,
  sanitizeFileName,
} from '../utils/fileUtils.js';
import { updateHistoryItemWithDownloadedFiles } from './timelineStorage.js';
import { attachmentSelectors } from './selectors/autbankSelectors.js';
import { safeExtractText } from '../utils/normalizeText.js';

const VOLTAR_SELECTORS = [
  { xpath: '//input[@type="image" and contains(@src,"cmdvoltar")]' },
  { id: 'page:frmre_consulta_anexos:re_btn_voltar' },
];

const GRID_POLL_MS = 250;
const GRID_TIMEOUT_MS = 60000;

/**
 * Aguarda a grid de anexos aparecer (polling 250ms, evita implicit wait de 5-30s)
 */
async function waitForAttachmentGrid(driver) {
  const start = Date.now();
  while (Date.now() - start < GRID_TIMEOUT_MS) {
    await driver.switchTo().defaultContent();
    const frames = await driver.findElements(By.css('iframe, frame'));
    if (frames.length === 0) {
      await sleep(GRID_POLL_MS);
      continue;
    }
    await driver.switchTo().frame(frames[0]);
    const rows = await driver.findElements(By.css(attachmentSelectors.rows.css));
    if (rows.length > 0) {
      logger.info(`Grid de anexos carregou em ${((Date.now() - start) / 1000).toFixed(1)}s`);
      return rows;
    }
    await sleep(GRID_POLL_MS);
  }
  logger.warn('Timeout aguardando grid de anexos.');
  return [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Localiza o input[type="image"] de download em uma linha da grid
 * @param {WebDriver} driver
 * @param {WebElement} rowElement - elemento tr da linha
 * @returns {Promise<WebElement|null>}
 */
async function findDownloadInputInRow(driver, rowElement) {
  try {
    const input = await rowElement.findElement(By.css('td:nth-child(2) input[type="image"]'));
    return input;
  } catch {
    try {
      return await rowElement.findElement(By.css('input[alt="Abrir/Salvar Anexo"]'));
    } catch {
      return await rowElement.findElement(By.css('input[type="image"][src*="gridvisualizaranexo"]'));
    }
  }
}

/**
 * Clica no input[type="image"] com estratégia robusta:
 * 1. clique normal 2. Actions 3. JavaScript
 * @param {Object} ctx - { driver, element }
 * @returns {Promise<{ success: boolean, strategy: string }>}
 */
async function clickAttachmentImageInput(ctx) {
  const { driver, element } = ctx;

  logger.info('Localizando input type=image do anexo...');
  logger.info('Elemento de download encontrado.');
  logger.info('Aplicando scroll até o elemento...');

  await driver.executeScript(
    "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
    element
  );

  const isEnabled = await element.isEnabled();
  const isDisplayed = await element.isDisplayed();
  if (!isEnabled || !isDisplayed) {
    logger.warn('Elemento não está habilitado ou visível. Tentando clique via JavaScript.');
  }

  logger.info('Tentando clique normal no input image...');
  try {
    await element.click();
    logger.info('Clique normal funcionou.');
    return { success: true, strategy: 'clique normal' };
  } catch (e1) {
    logger.info('Clique normal falhou, tentando Actions...');
    try {
      await driver.actions().move({ origin: element }).click().perform();
      logger.info('Clique via Actions funcionou.');
      return { success: true, strategy: 'clique via actions' };
    } catch (e2) {
      logger.info('Actions falhou, tentando JavaScript click...');
      try {
        await driver.executeScript('arguments[0].click();', element);
        logger.info('Clique via JavaScript funcionou.');
        return { success: true, strategy: 'clique via javascript' };
      } catch (e3) {
        try {
          await driver.executeScript(
            "arguments[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));",
            element
          );
          logger.info('Clique via dispatchEvent funcionou.');
          return { success: true, strategy: 'clique via dispatchEvent' };
        } catch (e4) {
          logger.warn('Todas as estratégias de clique falharam.');
          throw e4;
        }
      }
    }
  }
}

/**
 * Obtém todas as linhas da grid de anexos
 */
async function getAttachmentRows(driver) {
  await driver.switchTo().defaultContent();
  const frames = await driver.findElements(By.css('iframe, frame'));
  if (frames.length === 0) return [];

  await driver.switchTo().frame(frames[0]);
  const rows = await driver.findElements(By.css(attachmentSelectors.rows.css));
  return rows;
}

/**
 * Coleta dados das linhas da grid de anexos (sem armazenar elementos - evita stale)
 * coluna 1 = nome do arquivo, coluna 2 = input image de download
 */
async function collectAttachmentRows(driver, waitForGrid = false) {
  const rows = await getAttachmentRows(driver, waitForGrid);
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = await rows[i].findElements(By.css('td'));
    if (cells.length < 2) continue;

    const fileName = await safeExtractText(cells[0]);
    let hasDownloadControl = false;
    try {
      const input = await findDownloadInputInRow(driver, rows[i]);
      hasDownloadControl = !!input;
    } catch {}

    result.push({
      rowIndex: i + 1,
      fileName: (fileName || '').trim() || `anexo_${i + 1}`,
      hasDownloadControl,
    });
  }

  return result;
}

/**
 * Baixa um anexo de uma linha específica (re-query para evitar elemento stale)
 * @returns {Promise<{ rowIndex: number, displayedName: string, savedFileName: string|null, success: boolean, error?: string }>}
 */
async function downloadAttachmentFromRow(driver, downloadDir, rowData, outputDir) {
  const { rowIndex, fileName: displayedName } = rowData;

  try {
    const rows = await getAttachmentRows(driver);
    const rowIdx = rowIndex - 1;
    if (rowIdx < 0 || rowIdx >= rows.length) {
      return { rowIndex, displayedName, savedFileName: null, success: false, error: 'Linha não encontrada' };
    }
    const rowElement = rows[rowIdx];
    const input = await findDownloadInputInRow(driver, rowElement);
    if (!input) {
      return { rowIndex, displayedName, savedFileName: null, success: false, error: 'Input não encontrado' };
    }

    const beforeSnapshot = getFileSnapshot(downloadDir);
    const beforeTime = beforeSnapshot.time - 500;

    await clickAttachmentImageInput({ driver, element: input });

    logger.info('Download iniciado, aguardando arquivo aparecer...');
    await waitForDownloadToFinish([outputDir, downloadDir], 15000, 200);

    let newFiles = listNewFilesSince(downloadDir, beforeTime);
    if (newFiles.length === 0) {
      const filesInOutput = listNewFilesSince(outputDir, beforeTime);
      for (const { path: srcPath, name } of filesInOutput) {
        moveDownloadedFileIfNeeded(srcPath, downloadDir, name);
      }
      newFiles = listNewFilesSince(downloadDir, beforeTime);
    }

    const savedFileName = newFiles.length > 0 ? newFiles[0].name : null;
    if (savedFileName) {
      logger.info(`Download concluído: ${savedFileName}`);
    }

    return {
      rowIndex,
      displayedName,
      savedFileName,
      success: !!savedFileName,
    };
  } catch (e) {
    logger.warn(`Erro ao baixar anexo da linha ${rowIndex}:`, e.message);
    return {
      rowIndex,
      displayedName,
      savedFileName: null,
      success: false,
      error: e.message,
    };
  }
}

/**
 * Baixa todos os anexos da tela atual (grid de Consulta de Anexos)
 * @returns {Promise<Array<{ rowIndex: number, displayedName: string, savedFileName: string|null, success: boolean, error?: string }>>}
 */
async function downloadAttachmentsFromGrid(driver, downloadDir) {
  const outputDir = path.dirname(path.dirname(downloadDir));
  const results = [];

  try {
    logger.info('Aguardando grid de anexos carregar...');
    let originalImplicit = 5000;
    try {
      const t = await driver.manage().getTimeouts();
      originalImplicit = t.implicit ?? 5000;
      await driver.manage().setTimeouts({ implicit: 0 });
    } catch {}

    const rows = await collectAttachmentRows(driver, true);

    try {
      await driver.manage().setTimeouts({ implicit: originalImplicit });
    } catch {}
    const rowsWithDownload = rows.filter((r) => r.hasDownloadControl);

    if (rowsWithDownload.length === 0) {
      logger.info('Nenhuma linha com controle de download encontrada na grid de anexos.');
      return results;
    }

    logger.info(`Encontradas ${rowsWithDownload.length} linha(s) com anexo para baixar.`);

    for (const rowData of rowsWithDownload) {
      const result = await downloadAttachmentFromRow(driver, downloadDir, rowData, outputDir);
      results.push(result);
    }
  } catch (e) {
    logger.warn('Erro ao processar grid de anexos:', e.message);
  }

  return results;
}

export class AutbankAttachmentDownloader {
  constructor(driver, anexosDir) {
    this.driver = driver;
    this.anexosDir = anexosDir;
  }

  async prepareDownloadDir() {
    ensureDirectoryExists(this.anexosDir);
    await this.driver.setDownloadPath(this.anexosDir);
  }

  async returnFromAttachmentScreen() {
    logger.info('Voltando da tela de anexos...');

    const findAndClickVoltar = async () => {
      const driver = this.driver.getDriver();
      for (const sel of VOLTAR_SELECTORS) {
        try {
          const by = sel.xpath ? By.xpath(sel.xpath) : By.id(sel.id);
          const el = await driver.findElement(by);
          await driver.executeScript(
            'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
            el
          );
          return true;
        } catch {
          continue;
        }
      }
      return false;
    };

    const contexts = [
      () => this.driver.switchToMainContent(),
      () => this.driver.switchToConsultaFrame(),
    ];

    let clicked = false;
    for (const switchCtx of contexts) {
      try {
        await switchCtx();
        clicked = await findAndClickVoltar();
        if (clicked) break;
      } catch (e) {
        logger.warn('Voltar falhou neste contexto:', e.message);
      }
    }

    if (!clicked) {
      logger.warn('Tentando novamente...');
      for (const switchCtx of contexts) {
        try {
          await switchCtx();
          clicked = await findAndClickVoltar();
          if (clicked) break;
        } catch {}
      }
    }

    if (!clicked) logger.warn('Não foi possível clicar em Voltar.');
  }

  /**
   * Baixa todos os arquivos da tela de anexos atual
   * Retorna lista de caminhos relativos (ex: ["anexos/arquivo.pdf"]) para compatibilidade
   */
  async downloadAllAttachmentsInScreen(item) {
    const driver = this.driver.getDriver();

    try {
      await this.driver.switchToConsultaFrame();
    } catch {
      await this.driver.switchToMainContent();
    }

    let results = [];
    try {
      await this.driver.setDownloadPath(this.anexosDir);
      results = await downloadAttachmentsFromGrid(driver, this.anexosDir);
    } catch (e) {
      logger.warn('Erro ao baixar anexos da tela:', e.message);
      try {
        await this.driver.takeErrorScreenshot('anexos_grid_erro');
      } catch {}
    }

    return results
      .filter((r) => r.success && r.savedFileName)
      .map((r) => `anexos/${r.savedFileName}`);
  }

  async processAttachmentGroupsByPage(groups, pageNumbers, timelineCollector) {
    logger.info('Processando anexos agrupados por página...');

    for (const pageNum of pageNumbers) {
      const items = groups[pageNum] || [];
      if (items.length === 0) continue;

      logger.info(`Processando anexos da página ${pageNum}...`);

      for (const item of items) {
        try {
          logger.info(`Reposicionando para página ${pageNum}...`);
          await timelineCollector.goToTimelinePage(pageNum);

          logger.info(`Abrindo anexos da linha ${item.rowIndex} (${item.uniqueKey})...`);
          await timelineCollector.openAttachmentScreenForRow(item);

          const files = await this.downloadAllAttachmentsInScreen(item);
          updateHistoryItemWithDownloadedFiles(item, files);

          logger.info('Voltando da tela de anexos...');
          await this.returnFromAttachmentScreen();

          logger.info('Portal retornou para página 1. Reposicionando...');
        } catch (e) {
          logger.warn(`Erro ao baixar anexos do item ${item.uniqueKey}:`, e.message);
          try {
            await this.driver.takeErrorScreenshot(`anexo_${sanitizeFileName(item.uniqueKey || 'item')}`);
          } catch {}
          try {
            await this.returnFromAttachmentScreen();
          } catch {}
        }
      }

      logger.info(`Página ${pageNum} finalizada.`);
    }

    logger.info('Download de anexos concluído.');
  }
}
