/**
 * Download de anexos da RA
 * FASE 3: Download dos anexos agrupados por página
 * Regra: botão Voltar sempre retorna para página 1 - sempre reposicionar explicitamente
 */

import path from 'path';
import { By } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import {
  ensureDirectoryExists,
  waitForDownloadToFinish,
  listNewFilesSince,
  moveDownloadedFileIfNeeded,
  sanitizeFileName,
} from '../utils/fileUtils.js';
import { updateHistoryItemWithDownloadedFiles } from './timelineStorage.js';

const VOLTAR_SELECTORS = [
  { xpath: '/html/body/div[3]/div/form/div[6]/div[2]/input' },
  { xpath: '//*[@id="page:frmre_consulta_anexos:re_btn_voltar"]/input' },
  { css: '#page\\:frmre_consulta_anexos\\:re_btn_voltar > input' },
  { css: '#page\\:frmre_consulta_anexos\\:re_btn_voltar input' },
  { xpath: '//input[@type="image" and contains(@src,"cmdvoltar")]' },
  { id: 'page:frmre_consulta_anexos:re_btn_voltar' },
];

const DOWNLOAD_BUTTON_SELECTORS = [
  { xpath: '//*[@id="page:frmre_consulta_anexos:ssBTOREAnexosGrid0"]/tbody/tr/td[2]/input' },
  { xpath: '/html/body/div[3]/div/form/div[6]/div[1]/div/table/tbody/tr/td[2]/input' },
  { css: '#page\\:frmre_consulta_anexos\\:ssBTOREAnexosGrid0 tbody tr td:nth-child(2) input' },
];

export class AutbankAttachmentDownloader {
  constructor(driver, anexosDir) {
    this.driver = driver;
    this.anexosDir = anexosDir;
  }

  async prepareDownloadDir() {
    ensureDirectoryExists(this.anexosDir);
    await this.driver.setDownloadPath(this.anexosDir);
  }

  /**
   * Clica em Voltar na tela de anexos
   * Portal SEMPRE retorna para página 1 - não confiar no estado da interface
   */
  async returnFromAttachmentScreen() {
    logger.info('Voltando da tela de anexos...');

    const findAndClickVoltar = async () => {
      const driver = this.driver.getDriver();
      for (const sel of VOLTAR_SELECTORS) {
        try {
          const by = sel.xpath ? By.xpath(sel.xpath) : sel.css ? By.css(sel.css) : By.id(sel.id);
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

    if (!clicked) {
      logger.warn('Não foi possível clicar em Voltar.');
    }
  }

  /**
   * Baixa todos os arquivos da tela de anexos atual
   * Retorna lista de caminhos relativos (ex: ["anexos/arquivo.pdf"])
   */
  async downloadAllAttachmentsInScreen(item) {
    const driver = this.driver.getDriver();
    const downloaded = [];
    const outputDir = path.dirname(path.dirname(this.anexosDir));

    try {
      await this.driver.switchToConsultaFrame();

      let buttons = [];
      for (const sel of DOWNLOAD_BUTTON_SELECTORS) {
        const by = sel.xpath ? By.xpath(sel.xpath) : By.css(sel.css);
        buttons = await driver.findElements(by);
        if (buttons.length > 0) break;
      }

      if (buttons.length === 0) {
        logger.info('Nenhum botão de download encontrado na tela.');
        return [];
      }

      logger.info(`Baixando ${buttons.length} arquivo(s)...`);

      for (let i = 0; i < buttons.length; i++) {
        const beforeTime = Date.now();
        await this.driver.setDownloadPath(this.anexosDir);
        await buttons[i].click();

        await waitForDownloadToFinish([outputDir, this.anexosDir], 25000);

        let newFiles = listNewFilesSince(this.anexosDir, beforeTime - 500);
        if (newFiles.length === 0) {
          const filesInOutput = listNewFilesSince(outputDir, beforeTime - 500);
          for (const { path: srcPath, name } of filesInOutput) {
            moveDownloadedFileIfNeeded(srcPath, this.anexosDir, name);
          }
          newFiles = listNewFilesSince(this.anexosDir, beforeTime - 500);
        }

        for (const { name } of newFiles) {
          downloaded.push(`anexos/${name}`);
        }
      }
    } catch (e) {
      logger.warn('Erro ao baixar anexos:', e.message);
    }

    return downloaded;
  }

  /**
   * FASE 3: Processa anexos agrupados por página
   * Para cada página: reposicionar -> abrir cada item -> baixar -> voltar -> aceitar página 1
   */
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
