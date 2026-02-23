/**
 * Handle PDF document: download from Telegram, parse with lib/extract-armario-pdf,
 * then reply with summary and enabled output files.
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from './config.mjs';
import * as log from './logger.mjs';
import { getProductosMap } from './productos.mjs';
import { extractArmarioFromPdf, extractArmarioLinesOnly } from '../lib/extract-armario-pdf.mjs';

const TELEGRAM_FILE_BASE = 'https://api.telegram.org/file/bot';

async function downloadFileFromTelegram(telegram, fileId, destPath) {
  log.debug('Downloading PDF from Telegram…');
  const file = await telegram.getFile(fileId);
  const filePath = file.file_path;
  const url = `${TELEGRAM_FILE_BASE}${config.token}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  log.info('PDF downloaded.');
  return destPath;
}

function ensureOutputDir() {
  const dir = config.outputDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Sanitize a string for use as a filename (no path separators or reserved chars). */
function sanitizeBasename(s) {
  if (s == null || String(s).trim() === '') return '';
  return String(s)
    .replace(/[/\\:*?"<>|]/g, ' ')
    .replace(/\s+/g, '_')
    .trim()
    .slice(0, 200) || 'armario';
}

/**
 * Try armario extraction; return { success: true, head, components } or { success: false }.
 */
async function tryArmarioExtraction(pdfPath, outDir, basename) {
  const options = {
    xlsx: config.outputXlsx,
    html: config.outputHtml,
  };
  if (config.dataDir) {
    const columnMapPath = path.join(config.dataDir, 'column-map.json');
    if (fs.existsSync(columnMapPath)) {
      options.columnMapPath = columnMapPath;
      log.logFileLoad('Column map', columnMapPath);
    }
  }
  const productosMap = getProductosMap();
  if (productosMap) options.productosPriceMap = productosMap;

  log.debug('Parsing PDF (armario extraction)…');
  log.logFileLoad('PDF input', pdfPath);
  log.logFileLoad('Output base', path.join(outDir, basename));
  try {
    const { head, components } = await extractArmarioFromPdf(pdfPath, path.join(outDir, basename), options);
    const valid = components && Array.isArray(components) && components.length >= 0;
    if (!valid && (!head || Object.keys(head).length === 0)) {
      return { success: false };
    }
    log.info('Armario extraction OK.');
    return { success: true, head, components };
  } catch {
    log.debug('Armario extraction failed, will try lines-only.');
    return { success: false };
  }
}

/**
 * Run lines-only extraction; returns { lines }.
 */
async function runLinesOnlyExtraction(pdfPath, outDir, basename) {
  log.debug('Parsing PDF (lines-only)…');
  log.logFileLoad('PDF input', pdfPath);
  log.logFileLoad('Output base', path.join(outDir, basename));
  const result = await extractArmarioLinesOnly(pdfPath, path.join(outDir, basename));
  log.info('Lines-only extraction OK.');
  return result;
}

function armarioSummary(head, components) {
  const id = head?.armarioId || head?.armarioIdRaw || '—';
  const n = Array.isArray(components) ? components.length : 0;
  return `Armario: ${id}, ${n} componentes.`;
}

function linesSummary(result) {
  const n = result?.lines?.length ?? 0;
  return `Lines-only: ${n} lines.`;
}

async function sendResultFiles(ctx, basePath, isArmario) {
  const toSend = [];
  if (isArmario) {
    if (config.outputJson && fs.existsSync(basePath + '.json')) toSend.push({ path: basePath + '.json', name: path.basename(basePath) + '.json' });
    if (config.outputCsv && fs.existsSync(basePath + '.csv')) toSend.push({ path: basePath + '.csv', name: path.basename(basePath) + '.csv' });
    if (config.outputMd && fs.existsSync(basePath + '.md')) toSend.push({ path: basePath + '.md', name: path.basename(basePath) + '.md' });
    if (config.outputXlsx && fs.existsSync(basePath + '.xlsx')) toSend.push({ path: basePath + '.xlsx', name: path.basename(basePath) + '.xlsx' });
    if (config.outputHtml && fs.existsSync(basePath + '.html')) toSend.push({ path: basePath + '.html', name: path.basename(basePath) + '.html' });
  } else {
    if (config.outputLinesTxt && fs.existsSync(basePath + '.lines.txt')) toSend.push({ path: basePath + '.lines.txt', name: path.basename(basePath) + '.lines.txt' });
    if (config.outputLinesJson && fs.existsSync(basePath + '.lines.json')) toSend.push({ path: basePath + '.lines.json', name: path.basename(basePath) + '.lines.json' });
  }
  for (const { path: filePath, name } of toSend) {
    await ctx.replyWithDocument({ source: fs.createReadStream(filePath), filename: name });
  }
}

/**
 * Handle an incoming PDF document: download, parse, reply with summary and enabled outputs.
 * @param {object} ctx - Telegraf context (channel_post or message)
 * @param {string} fileId - Telegram file_id of the document
 */
export async function handlePdfDocument(ctx, fileId) {
  log.info('PDF received.');

  const outDir = ensureOutputDir();
  log.logFileLoad('Output dir', outDir);
  const basename = randomUUID();
  const pdfPath = path.join(outDir, basename + '.pdf');
  const basePath = path.join(outDir, basename);
  let resultBasePath = basePath;

  try {
    await downloadFileFromTelegram(ctx.telegram, fileId, pdfPath);
  } catch (err) {
    log.error('Download failed: ' + err.message);
    await ctx.reply('No se pudo descargar el PDF.');
    return;
  }

  try {
    const armarioResult = await tryArmarioExtraction(pdfPath, outDir, basename);
    if (armarioResult.success) {
      const armarioIdBasename = sanitizeBasename(armarioResult.head?.armarioId || armarioResult.head?.armarioIdRaw) || basename;
      if (armarioIdBasename !== basename) {
        resultBasePath = path.join(outDir, armarioIdBasename);
        for (const ext of ['.json', '.csv', '.md', '.xlsx', '.html']) {
          const src = basePath + ext;
          const dest = resultBasePath + ext;
          if (fs.existsSync(src)) fs.renameSync(src, dest);
        }
      }
      log.debug('Sending armario result to channel.');
      await ctx.reply(armarioSummary(armarioResult.head, armarioResult.components));
      await sendResultFiles(ctx, resultBasePath, true);
    } else {
      const linesResult = await runLinesOnlyExtraction(pdfPath, outDir, basename);
      log.debug('Sending lines-only result to channel.');
      await ctx.reply(linesSummary(linesResult));
      await sendResultFiles(ctx, basePath, false);
    }
  } catch (err) {
    log.error('Parse failed: ' + err.message);
    await ctx.reply('No se pudo parsear el PDF.');
  } finally {
    try {
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      for (const ext of ['.json', '.csv', '.md', '.xlsx', '.html', '.lines.txt', '.lines.json']) {
        const p = basePath + ext;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      if (resultBasePath !== basePath) {
        for (const ext of ['.json', '.csv', '.md', '.xlsx', '.html']) {
          const p = resultBasePath + ext;
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }
      }
    } catch {
      // ignore cleanup errors
    }
  }
}
