/**
 * Serviço de exportação completa de RAs
 * Três fases bem separadas:
 * FASE 1: Scraping textual completo -> salvar JSON/TXT
 * FASE 2: Agrupamento dos itens com anexo por página
 * FASE 3: Download dos anexos agrupados por página
 */

import fs from 'fs';
import path from 'path';
import { getEnvConfig } from '../config/env.js';
import { AutbankDriver } from '../automation/AutbankDriver.js';
import { AutbankLoginFlow } from '../automation/AutbankLoginFlow.js';
import { AutbankSearchFlow } from '../automation/AutbankSearchFlow.js';
import { AutbankDetailsFlow } from '../automation/AutbankDetailsFlow.js';
import { AutbankTimelineCollector } from '../automation/AutbankTimelineCollector.js';
import { AutbankAttachmentDownloader } from '../automation/AutbankAttachmentDownloader.js';
import { extractItemsWithAttachments, groupAttachmentItemsByPage } from '../automation/attachmentHelpers.js';
import { saveTimelineJson } from '../automation/timelineStorage.js';
import { logger } from '../utils/logger.js';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

/**
 * Exporta uma ou mais RAs para disco
 */
export async function exportRas(ras, outputDir, options = {}) {
  const config = getEnvConfig();
  const headless = options.headless ?? config.headless;

  ensureDirectoryExists(outputDir);

  const driver = new AutbankDriver({
    browser: config.browser,
    headless,
    timeouts: config.timeouts,
  });

  const results = [];

  try {
    await driver.start(outputDir);

    const loginFlow = new AutbankLoginFlow(driver);
    await loginFlow.execute(config.autbank.baseUrl, config.autbank.email, config.autbank.password, {
      landingUrl: config.autbank.landingUrl,
      portalLinkSelector: config.autbank.portalLinkSelector,
      useWindowSwitch: config.autbank.useWindowSwitch,
    });

    const searchFlow = new AutbankSearchFlow(driver);
    const detailsFlow = new AutbankDetailsFlow(driver);
    const timelineCollector = new AutbankTimelineCollector(driver);

    for (let i = 0; i < ras.length; i++) {
      const ra = String(ras[i]).trim();
      if (!ra) continue;

      const raResult = await processRa(
        ra,
        outputDir,
        driver,
        searchFlow,
        detailsFlow,
        timelineCollector
      );
      results.push(raResult);
    }
  } catch (error) {
    logger.error('Erro na exportação:', error.message);
    try {
      await driver.takeErrorScreenshot('export_error');
    } catch {}
    throw error;
  } finally {
    await driver.quit();
  }

  return results;
}

async function processRa(ra, outputDir, driver, searchFlow, detailsFlow, timelineCollector) {
  const raDir = path.join(outputDir, ra);
  const anexosDir = path.join(raDir, 'anexos');
  const logPath = path.join(raDir, 'execution.log');
  const logLines = [];

  const addLog = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    logLines.push(line);
    logger.info(`[RA ${ra}] ${msg}`);
  };

  try {
    ensureDirectoryExists(raDir);
    ensureDirectoryExists(anexosDir);

    addLog('Iniciando processamento');

    const searchResult = await searchFlow.searchAndOpenRa(ra);
    if (!searchResult.found) {
      addLog('RA não encontrada');
      saveExecutionLog(logPath, logLines);
      return {
        ra,
        success: false,
        error: 'RA não encontrada',
        interacoesColetadas: 0,
        anexosBaixados: 0,
        pastaGerada: null,
      };
    }

    addLog('Extraindo dados gerais...');
    const dadosGerais = await detailsFlow.extractRaGeneralData();

    addLog('Iniciando coleta textual completa da RA...');
    addLog('FASE 1: Coletando histórico completo (apenas texto, sem clicar em anexos)...');
    let history;
    let totalPages;
    try {
      const result = await timelineCollector.collectFullTimelineTextOnly();
      history = result.history;
      totalPages = result.totalPages;
    } catch (timelineError) {
      addLog(`Erro na coleta do histórico: ${timelineError.message}`);
      const partial = timelineCollector.getPartialHistory?.();
      if (partial?.history?.length > 0) {
        addLog(`Salvando histórico parcial (${partial.history.length} itens)...`);
        history = partial.history;
        totalPages = partial.totalPages ?? 1;
        saveTimelineJson(ra, history, totalPages, raDir, dadosGerais);
      }
      throw timelineError;
    }

    addLog('Histórico salvo em JSON.');
    saveTimelineJson(ra, history, totalPages, raDir, dadosGerais);

    const resumo = {
      ra,
      dadosGerais: {
        numeroRA: dadosGerais.numeroRA || ra,
        sistemaOriginal: dadosGerais.sistemaOriginal,
        sistemaAtual: dadosGerais.sistemaAtual,
        versao: dadosGerais.versao,
        dataAbertura: dadosGerais.dataAbertura,
        ambiente: dadosGerais.ambiente,
        assunto: dadosGerais.assunto,
        itemMenu: dadosGerais.itemMenu,
        contato: dadosGerais.contato,
        situacao: dadosGerais.situacao,
        atendente: dadosGerais.atendente,
      },
      metadataColeta: {
        coletadoEm: new Date().toISOString(),
        origem: 'Autbank',
        statusExecucao: 'sucesso',
      },
    };
    fs.writeFileSync(
      path.join(raDir, `ra_${ra}_resumo.json`),
      JSON.stringify(resumo, null, 2),
      'utf8'
    );

    addLog('FASE 2: Agrupando itens com anexo por página...');
    const itemsComAnexo = extractItemsWithAttachments(history);
    const { groups, pageNumbers } = groupAttachmentItemsByPage(itemsComAnexo);

    if (itemsComAnexo.length > 0) {
      addLog('FASE 3: Iniciando download de anexos agrupados por página...');
      const downloader = new AutbankAttachmentDownloader(driver, anexosDir);
      await downloader.prepareDownloadDir();
      await downloader.processAttachmentGroupsByPage(groups, pageNumbers, timelineCollector);

      addLog('Atualizando JSON com anexos baixados...');
      saveTimelineJson(ra, history, totalPages, raDir, dadosGerais);
      addLog('Download de anexos concluído.');
    }

    const totalAnexos = history.reduce((s, h) => s + (h.anexosBaixados?.length || 0), 0);
    saveExecutionLog(logPath, logLines);

    addLog('Exportação concluída');

    return {
      ra,
      success: true,
      interacoesColetadas: history.length,
      anexosBaixados: totalAnexos,
      pastaGerada: raDir,
    };
  } catch (error) {
    addLog(`Erro: ${error.message}`);
    saveExecutionLog(logPath, logLines);
    ensureDirectoryExists(raDir);
    try {
      await driver.takeErrorScreenshot(`ra_${ra}_erro`);
    } catch {}

    return {
      ra,
      success: false,
      error: error.message,
      interacoesColetadas: 0,
      anexosBaixados: 0,
      pastaGerada: raDir,
    };
  }
}

function saveExecutionLog(logPath, lines) {
  try {
    fs.writeFileSync(logPath, lines.join('\n'), 'utf8');
  } catch (e) {
    logger.warn('Falha ao salvar execution.log:', e.message);
  }
}
