/**
 * Fluxo de login no portal Autbank
 * Implementa troca explícita de janela/aba após clique no link do portal
 */

import { logger } from '../utils/logger.js';
import {
  loginSelectors,
  menuSelectors,
  portalLinkSelectors,
} from './selectors/autbankSelectors.js';
import { sleep } from '../utils/safeWait.js';

export class AutbankLoginFlow {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Executa o fluxo completo de login
   * Ordem: openPortalFromLink -> switchToPortalWindow -> waitForLoginScreen -> performLogin
   * Ou (useWindowSwitch=false): navigate -> waitForLoginScreen -> performLogin
   */
  async execute(baseUrl, email, password, config = {}) {
    const landingUrl = config.landingUrl || baseUrl;
    const portalLinkSelector = config.portalLinkSelector
      ? { css: config.portalLinkSelector }
      : portalLinkSelectors;
    const useWindowSwitch = config.useWindowSwitch !== false;

    if (useWindowSwitch) {
      const oldHandles = await this.openPortalFromLink(landingUrl, portalLinkSelector);
      await this.switchToPortalWindow(oldHandles);
    } else {
      logger.info('Acessando portal (navegação direta)...');
      await this.driver.navigateAndSwitchIfNewWindow(landingUrl);
    }

    await this.waitForLoginScreen();

    logger.info('Preenchendo credenciais');
    await this.performLogin(email, password);

    logger.info('Efetuando login');

    const loggedIn = await this.validateLogin();
    if (!loggedIn) {
      throw new Error('Login falhou - credenciais inválidas ou portal indisponível');
    }
    logger.info('Login realizado com sucesso');
  }

  /**
   * Navega para a página inicial e clica no link que abre o portal.
   * Retorna os handles das janelas antes do clique.
   */
  async openPortalFromLink(landingUrl, portalLinkSelector) {
    logger.info('Acessando portal...');
    await this.driver.navigate(landingUrl);

    logger.info('Capturando janelas atuais antes do clique');
    const oldHandles = await this.driver.getWindowHandles();

    logger.info('Clicando no link do portal');
    await this.driver.waitAndClick(portalLinkSelector);

    return oldHandles;
  }

  /**
   * Aguarda nova janela e alterna para ela.
   * Se não houver nova janela, registra erro claro.
   */
  async switchToPortalWindow(oldHandles) {
    try {
      logger.info('Aguardando abertura de nova janela');
      await this.driver.waitForNewWindow(oldHandles);
      logger.info('Nova janela identificada com sucesso');
      logger.info('Alternando para nova janela');
      await this.driver.switchToNewestWindow(oldHandles);
    } catch (error) {
      await this.driver.takeErrorScreenshot('nova_janela_nao_aberta');
      throw new Error(
        `Nova janela não foi aberta após o clique. ${error.message}`
      );
    }
  }

  /**
   * Aguarda a tela de login carregar completamente.
   * Valida presença e interatividade de: campo usuário, campo senha, botão login.
   * Usa waits explícitos (elementLocated, elementIsVisible, elementIsEnabled).
   */
  async waitForLoginScreen() {
    const timeout = this.driver.config?.timeouts?.element ?? 15000;

    const steps = [
      { name: 'campo de e-mail/usuário', selector: loginSelectors.userField },
      { name: 'campo de senha', selector: loginSelectors.passwordField },
      { name: 'botão de login', selector: loginSelectors.loginButton },
    ];

    for (const step of steps) {
      try {
        await this.driver.waitForElementVisibleAndEnabled(step.selector, timeout);
      } catch (error) {
        await this.driver.takeErrorScreenshot('tela_login_nao_carregou');
        throw new Error(
          `Tela de login não carregou corretamente. Falha na etapa: ${step.name}. ${error.message}`
        );
      }
    }

    logger.info('Tela de login localizada');
  }

  /**
   * Preenche credenciais e clica em login
   */
  async performLogin(email, password) {
    await this.driver.waitAndType(loginSelectors.userField, email);

    await this.driver.waitAndType(loginSelectors.passwordField, password);
    await this.driver.waitAndClick(loginSelectors.loginButton);
  }

  /**
   * Valida se o login foi bem-sucedido
   * Verifica se o menu de Consulta de RA está visível
   */
  async validateLogin() {
    try {
      await this.driver.waitAndFind(menuSelectors.consultaRaMenu, 10000);
      return true;
    } catch {
      try {
        await this.driver.waitAndFind(loginSelectors.loginButton, 3000);
        return false;
      } catch {
        return false;
      }
    }
  }
}
