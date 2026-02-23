/**
 * Telegram bot entry: listen for PDF documents in DMs and/or channels,
 * download, parse with lib/extract-armario-pdf, reply with summary and output files.
 * Configuration is via environment variables only; .env is loaded in config.mjs.
 */
import { Telegraf } from 'telegraf';
import { config } from './config.mjs';
import * as log from './logger.mjs';
import { loadProductos, getLoadedPath } from './productos.mjs';
import { handlePdfDocument } from './pdf-handler.mjs';

if (!config.token) {
  console.error('TELEGRAM_BOT_TOKEN is required. Set it in the environment or in bot/.env');
  process.exit(1);
}

const bot = new Telegraf(config.token);

function isPdfDocument(doc) {
  if (!doc) return false;
  const mime = doc.mime_type || '';
  return doc.file_name?.toLowerCase().endsWith('.pdf') || mime === 'application/pdf';
}

if (config.listenDms) {
  bot.on('message', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;
    if (!ctx.message?.document) return;
    if (!isPdfDocument(ctx.message.document)) {
      await ctx.reply('Solo se aceptan PDFs.');
      return;
    }
    await handlePdfDocument(ctx, ctx.message.document.file_id);
  });
}

if (config.listenChannels) {
  bot.on('channel_post', async (ctx) => {
    const post = ctx.channelPost;
    if (!post?.document) return;
    if (!isPdfDocument(post.document)) {
      await ctx.reply('Solo se aceptan PDFs.');
      return;
    }
    await handlePdfDocument(ctx, post.document.file_id);
  });
  bot.on('channel_post', (ctx, next) => {
    const post = ctx.channelPost;
    if (post?.text?.trim() === '/reload_productos') return handleReloadProductos(ctx);
    return next();
  });
}

async function handleReloadProductos(ctx) {
  const { map, path: p } = loadProductos();
  if (p && map !== null) {
    await ctx.reply(`Productos recargados: ${map.size} entradas desde ${p}`);
  } else if (p) {
    await ctx.reply(`Error al cargar productos desde ${p}. Comprueba el formato del archivo.`);
  } else {
    const pathHint = config.productosPath || 'ZENBAT_BOT_PRODUCTOS_PATH o ZENBAT_BOT_DATA_DIR';
    await ctx.reply(`Productos no configurados. Define ${pathHint} (p. ej. datos/productos.xlsx).`);
  }
}

bot.command('reload_productos', handleReloadProductos);

loadProductos();

bot.launch().then(() => {
  const modes = [];
  if (config.listenDms) modes.push('DMs');
  if (config.listenChannels) modes.push('channels');
  log.info('Zenbat PDF bot running (' + (modes.length ? modes.join(', ') : 'no listeners') + '). Press Ctrl+C to stop.');
  log.logFileLoad('Output dir', config.outputDir);
  log.logFileLoad('Data dir', config.dataDir || '(not set)');
  const p = getLoadedPath();
  if (!p) log.info('Productos: no path configured (price enrichment disabled).');
}).catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
