/**
 * Logger centralizado para a aplicação
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = process.env.LOG_LEVEL || 'INFO';
const levelValue = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.INFO;

function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  return [prefix, message, ...args].filter(Boolean).join(' ');
}

export const logger = {
  debug(message, ...args) {
    if (levelValue <= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, ...args));
    }
  },

  info(message, ...args) {
    if (levelValue <= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, ...args));
    }
  },

  warn(message, ...args) {
    if (levelValue <= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, ...args));
    }
  },

  error(message, ...args) {
    if (levelValue <= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, ...args));
    }
  },
};
