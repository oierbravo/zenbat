/**
 * Cached productos price map. Loaded at bot start and on /reload_productos.
 */
import fs from 'fs';
import path from 'path';
import { config } from './config.mjs';
import { loadProductosPriceMap } from '../lib/extract-armario-pdf.mjs';
import * as log from './logger.mjs';

let cachedMap = null;
let loadedPath = null;

/**
 * Load productos from config path. Returns the map and path used (or null if no path / file missing).
 */
export function loadProductos() {
  const configured = config.productosPath;
  log.logFileLoad('Productos configured path', configured || '(not set)');

  if (!configured) {
    cachedMap = null;
    loadedPath = null;
    return { map: null, path: null };
  }

  const resolved = path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  log.logFileLoad('Productos resolved path', resolved, fs.existsSync(resolved) ? 'exists' : 'NOT FOUND');

  if (!fs.existsSync(resolved)) {
    log.error(`Productos file not found: ${resolved}`);
    cachedMap = null;
    loadedPath = null;
    return { map: null, path: resolved };
  }

  try {
    cachedMap = loadProductosPriceMap(resolved);
    loadedPath = resolved;
    log.info(`Productos loaded: ${resolved} (${cachedMap.size} entries)`);
    if (cachedMap.size === 0) {
      log.info('Productos: 0 entries. Expected columns "codigo" and "precioUnit" (or "Codigo"/"Precio Unitario" in first row).');
    }
    return { map: cachedMap, path: resolved };
  } catch (err) {
    log.error(`Productos load failed: ${resolved} — ${err.message}`);
    cachedMap = null;
    loadedPath = null;
    return { map: null, path: resolved };
  }
}

export function getProductosMap() {
  return cachedMap;
}

/** Path from which productos were last loaded, or null. */
export function getLoadedPath() {
  return loadedPath;
}
