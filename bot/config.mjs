/**
 * Bot configuration from environment variables only.
 * .env is loaded here so it runs before any process.env is read (imports are hoisted in the entry point).
 */
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

function parseBool(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const v = String(value).toLowerCase();
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return true;
}

function get(envKey, defaultValue) {
  const env = process.env[envKey];
  return env !== undefined && env !== '' ? env : defaultValue;
}

function getBool(envKey, defaultValue = true) {
  const raw = get(envKey, undefined);
  if (raw === undefined) return defaultValue;
  return parseBool(raw, defaultValue);
}

function resolveDir(value) {
  if (!value || value === '') return null;
  const p = path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  return p;
}

export const config = {
  token: get('TELEGRAM_BOT_TOKEN', ''),
  parseMode: get('ZENBAT_BOT_PARSE_MODE', 'armario_then_lines'),

  dataDir: resolveDir(get('ZENBAT_BOT_DATA_DIR', null)),
  outputDir: resolveDir(get('ZENBAT_BOT_OUTPUT_DIR', null)) || os.tmpdir(),

  /** Listen to direct (private) messages. Default: true. */
  listenDms: getBool('ZENBAT_BOT_LISTEN_DMS', true),
  /** Listen to channel posts. Default: false. */
  listenChannels: getBool('ZENBAT_BOT_LISTEN_CHANNELS', false),

  /** Log level: quiet | none | error | info | debug | verbose. quiet=error, verbose=debug. Default: info */
  logLevel: (() => {
    const v = get('ZENBAT_BOT_LOG_LEVEL', 'info').toLowerCase();
    if (v === 'quiet') return 'error';
    if (v === 'verbose') return 'debug';
    return ['none', 'error', 'info', 'debug'].includes(v) ? v : 'info';
  })(),

  /** Path to productos.xlsx (for price enrichment). If unset, uses dataDir/productos.xlsx when dataDir is set. */
  get productosPath() {
    const explicit = get('ZENBAT_BOT_PRODUCTOS_PATH', null);
    if (explicit) return resolveDir(explicit);
    const dataDir = resolveDir(get('ZENBAT_BOT_DATA_DIR', null));
    return dataDir ? path.join(dataDir, 'productos.xlsx') : null;
  },

  outputXlsx: getBool('ZENBAT_BOT_OUTPUT_XLSX', true),
  outputMd: getBool('ZENBAT_BOT_OUTPUT_MD', true),
  outputHtml: getBool('ZENBAT_BOT_OUTPUT_HTML', true),
  outputCsv: getBool('ZENBAT_BOT_OUTPUT_CSV', true),
  outputJson: getBool('ZENBAT_BOT_OUTPUT_JSON', true),
  outputLinesTxt: getBool('ZENBAT_BOT_OUTPUT_LINES_TXT', true),
  outputLinesJson: getBool('ZENBAT_BOT_OUTPUT_LINES_JSON', true),
};

export default config;
