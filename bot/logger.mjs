/**
 * Configurable terminal logger. Only logs when level is enabled by ZENBAT_BOT_LOG_LEVEL.
 * quiet = error only (clean output). verbose = debug (all file paths and load details).
 */
import { config } from './config.mjs';

const LEVELS = { none: 0, error: 1, info: 2, debug: 3 };
const current = LEVELS[config.logLevel] ?? LEVELS.info;

function enabled(level) {
  return LEVELS[level] <= current && current > 0;
}

export function error(msg) {
  if (enabled('error')) console.error('[bot]', msg);
}

export function info(msg) {
  if (enabled('info')) console.log('[bot]', msg);
}

export function debug(msg) {
  if (enabled('debug')) console.log('[bot]', msg);
}

/** Log file load: path and description. Uses debug so it appears in verbose mode. */
export function logFileLoad(label, filePath, detail = '') {
  if (!enabled('debug')) return;
  const d = detail ? ` ${detail}` : '';
  console.log('[bot]', `${label}: ${filePath}${d}`);
}
