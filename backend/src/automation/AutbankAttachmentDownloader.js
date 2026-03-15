/**
 * Download de anexos da RA
 * ETAPA 2: Executada APÓS o histórico estar salvo
 */

import path from 'path';
import fs from 'fs';
import { By } from 'selenium-webdriver';
import { logger } from '../utils/logger.js';
import { attachmentSelectors } from './selectors/autbankSelectors.js';
import { sleep } from '../utils/safeWait.js';
import {
  ensureDirectoryExists,
  waitForDownloadToFinish,
  listNewFilesSince,
  moveDownloadedFileIfNeeded,
} from '../utils/fileUtils.js';

export class AutbankAttachmentDownloader {
  constructor(driver, anexosDir) {
    this.driver = driver;
    this.anexosDir = anexosDir;
  }

  /**
   * Configura o diretório de download
   */
  async prepareDownloadDir() {
    ensureDirectoryExists(this.anexosDir);
    await this.driver.setDownloadPath(this.anexosDir);
  }

  /**
   * Clica em Voltar na tela de anexos (retorna para timeline)
   * Tenta múltiplos seletores e contextos (frame + main content).
   */
  async returnFromAttachmentScreen() {
    logger.info('Clicando em Voltar...');
    await sleep(300);

    const voltarSelectors = [
      { xpath: '/html/body/div[3]/div/form/div[6]/div[2]/input' },
      { xpath: '//*[@id="page:frmre_consulta_anexos:re_btn_voltar"]/input' },
      { css: '#page\\:frmre_consulta_anexos\\:re_btn_voltar > input' },
      { css: '#page\\:frmre_consulta_anexos\\:re_btn_voltar input' },
      { xpath: '//input[@type="image" and contains(@src,"cmdvoltar")]' },
      { xpath: '//input[contains(@name,"frmre_consulta_anexos") and contains(@src,"cmdvoltar")]' },
      { id: 'page:frmre_consulta_anexos:re_btn_voltar' },
    ];

    const findAndClickVoltar = async () => {
      const driver = this.driver.getDriver();
      for (const sel of voltarSelectors) {
        try {
          const by = sel.xpath ? By.xpath(sel.xpath) : sel.css ? By.css(sel.css) : By.id(sel.id);
          const el = await driver.findElement(by);
          if (el) {
            await driver.executeScript(
              'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
              el
            );
            logger.info('Botão Voltar clicado com sucesso.');
            return true;
          }
        } catch (e) {
          continue;
        }
      }
      return false;
    };

    const contexts = [
      { name: 'main content', fn: () => this.driver.switchToMainContent() },
      { name: 'frame consulta', fn: () => this.driver.switchToConsultaFrame() },
    ];

    let clicked = false;
    for (const ctx of contexts) {
      try {
        await ctx.fn();
        await sleep(300);
        clicked = await findAndClickVoltar();
        if (clicked) break;
      } catch (e) {
        logger.warn(`Voltar em ${ctx.name} falhou:`, e.message);
      }
    }

    if (!clicked) {
      logger.warn('Tentando novamente após breve espera...');
      await sleep(600);
      for (const ctx of contexts) {
        try {
          await ctx.fn();
          clicked = await findAndClickVoltar();
          if (clicked) break;
        } catch {}
      }
    }

    if (!clicked) {
      logger.warn('Não foi possível clicar em Voltar após todas as tentativas.');
    }

    await sleep(1000);
  }

  /**
   * Baixa todos os arquivos da tela de anexos atual.
   * Os arquivos vão para anexosDir (via CDP) ou para outputDir (Chrome prefs).
   * Se caírem em outputDir, move para anexosDir.
   */
  async downloadAllFilesFromAttachmentScreen() {
    const driver = this.driver.getDriver();
    const downloaded = [];
    const outputDir = path.dirname(path.dirname(this.anexosDir));

    try {
      const buttons = await driver.findElements(
        By.css('#page\\:frmre_consulta_anexos\\:ssBTOREAnexosGrid0 tbody tr td:nth-child(2) input')
      );

      for (let i = 0; i < buttons.length; i++) {
        const beforeTime = Date.now();
        await this.driver.setDownloadPath(this.anexosDir);
        await buttons[i].click();
        await sleep(800);

        await waitForDownloadToFinish([outputDir, this.anexosDir], 30000);

        let newFiles = listNewFilesSince(this.anexosDir, beforeTime - 1000);
        if (newFiles.length === 0) {
          const filesInOutput = listNewFilesSince(outputDir, beforeTime - 1000);
          for (const { path: srcPath, name } of filesInOutput) {
            moveDownloadedFileIfNeeded(srcPath, this.anexosDir, name);
          }
          newFiles = listNewFilesSince(this.anexosDir, beforeTime - 1000);
        }

        for (const { name } of newFiles) {
          downloaded.push(`anexos/${name}`);
        }
        await sleep(300);
      }
    } catch (e) {
      logger.warn('Erro ao baixar anexos:', e.message);
    }

    return downloaded;
  }

  /**
   * Abre o painel de anexos da linha (página atual deve estar correta)
   */
  async openAttachmentByRow(rowIndex) {
    const selector = `#page\\:frmre_consseqra_contato_r\\:ssBTORESequenciaRA0 tbody tr:nth-child(${rowIndex}) td:nth-child(8) input`;
    await this.driver.waitAndClick({ css: selector });
    await sleep(1000);
  }

  /**
   * ETAPA 2: Percorre itens com anexo e baixa todos
   */
  async downloadAttachmentsFromCollectedTimeline(historyItems, timelineCollector) {
    logger.info('Iniciando segunda passada para download de anexos...');

    for (const item of historyItems) {
      try {
        logger.info(`Reposicionando para página ${item.pageNumber}, linha ${item.rowIndex}...`);
        await timelineCollector.goToTimelinePage(item.pageNumber);
        await sleep(400);

        logger.info(`Baixando anexos do item uniqueKey ${item.uniqueKey}...`);
        await timelineCollector.openAttachmentByRow(item.rowIndex);
        const baixados = await this.downloadAllFilesFromAttachmentScreen();
        item.anexosBaixados = baixados;

        logger.info('Download concluído.');
        await this.returnFromAttachmentScreen();
        await sleep(800);
      } catch (e) {
        logger.warn(`Erro ao baixar anexos do item ${item.uniqueKey}:`, e.message);
        try {
          await this.driver.takeErrorScreenshot(`anexo_${item.uniqueKey}`);
        } catch {}
        await this.returnFromAttachmentScreen().catch(() => {});
        await sleep(500);
      }
    }
  }
}
