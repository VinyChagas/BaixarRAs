/**
 * Configuração e validação de variáveis de ambiente
 */

import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['AUTBANK_BASE_URL', 'AUTBANK_EMAIL', 'AUTBANK_PASSWORD'];

const optionalEnvVars = {
  BROWSER: 'chrome',
  HEADLESS: 'false',
  TIMEOUT_PAGE_LOAD: '30000',
  TIMEOUT_ELEMENT: '15000',
  TIMEOUT_IMPLICIT: '5000',
  PORT: '3001',
};

/**
 * Valida se todas as variáveis obrigatórias estão definidas
 */
function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}. ` +
        'Verifique o arquivo .env e use .env.example como referência.'
    );
  }
}

/**
 * Retorna a configuração de ambiente
 */
export function getEnvConfig() {
  return {
    autbank: {
      baseUrl: process.env.AUTBANK_BASE_URL?.trim(),
      landingUrl: process.env.AUTBANK_LANDING_URL?.trim() || process.env.AUTBANK_BASE_URL?.trim(),
      portalLinkSelector: process.env.AUTBANK_PORTAL_LINK_SELECTOR?.trim() || null,
      useWindowSwitch: process.env.AUTBANK_USE_WINDOW_SWITCH?.toLowerCase() !== 'false',
      email: process.env.AUTBANK_EMAIL?.trim(),
      password: process.env.AUTBANK_PASSWORD?.trim(),
    },
    browser: (process.env.BROWSER || optionalEnvVars.BROWSER).toLowerCase(),
    headless: process.env.HEADLESS?.toLowerCase() === 'true',
    timeouts: {
      pageLoad: parseInt(process.env.TIMEOUT_PAGE_LOAD || optionalEnvVars.TIMEOUT_PAGE_LOAD, 10),
      element: parseInt(process.env.TIMEOUT_ELEMENT || optionalEnvVars.TIMEOUT_ELEMENT, 10),
      implicit: parseInt(process.env.TIMEOUT_IMPLICIT || optionalEnvVars.TIMEOUT_IMPLICIT, 10),
    },
    port: parseInt(process.env.PORT || optionalEnvVars.PORT, 10),
  };
}

export { validateEnv };
