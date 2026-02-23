/**
 * Extract head and component table from an armario PDF.
 * Page 1: head (metadata) + table header + data rows.
 * Pages 2+: skip repeated head and table header, collect only data rows.
 *
 * Outputs: JSON (head + components), CSV, Markdown, and optionally XLSX (armario format).
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf2json = require('pdf2json');
const PDFParser = pdf2json.default ?? pdf2json;
const XLSX = require('xlsx');

const ARMARIO_HEADER = ['Codigo', 'Denominacion', 'PrecioUnitario', 'Cantidad', 'PrecioTotal'];

/** Default column mapping from PDF column names to armario header (can be overridden by config file). */
const DEFAULT_COLUMN_MAP = {
  Codigo: 'Codigo',
  Code: 'Codigo',
  Referencia: 'Codigo',
  Denominacion: 'Denominacion',
  Description: 'Denominacion',
  Descripcion: 'Denominacion',
  PrecioUnitario: 'PrecioUnitario',
  Precio: 'PrecioUnitario',
  Cantidad: 'Cantidad',
  Qty: 'Cantidad',
  PrecioTotal: 'PrecioTotal',
  Total: 'PrecioTotal',
};

/**
 * Load optional column mapping from JSON file (e.g. docs/examples/armarios/pdf/column-map.json).
 * @param {string} [configPath]
 * @returns {Object.<string, string>}
 */
function loadColumnMap(configPath) {
  if (!configPath || !fs.existsSync(configPath)) return DEFAULT_COLUMN_MAP;
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { ...DEFAULT_COLUMN_MAP, ...data };
  } catch {
    return DEFAULT_COLUMN_MAP;
  }
}

/**
 * Extract text runs from a pdf2json Text item into a single string.
 * @param {object} textItem - Item from Page.Texts[]
 * @returns {string}
 */
function textItemToString(textItem) {
  if (!textItem.R) return '';
  return textItem.R.map((r) => {
    try {
      return (decodeURIComponent(r.T || '') || '').trim();
    } catch {
      return (r.T || '').trim();
    }
  }).join('').trim();
}

/**
 * Build lines from a page: group Text items by similar y, sort by x within each line.
 * @param {object[]} texts - Page.Texts
 * @param {number} yTolerance - Max vertical distance to consider same line (default 5)
 * @returns {{ y: number, cells: string[] }[]}
 */
function pageToLines(texts, yTolerance = null) {
  if (!texts || texts.length === 0) return [];
  const withY = texts.map((t) => ({ y: t.y, text: textItemToString(t), x: t.x }));
  withY.sort((a, b) => b.y - a.y || a.x - b.x); // top of page first (PDF y often increases upward)
  const yValues = withY.filter((w) => w.text !== '').map((w) => w.y);
  const yRange = yValues.length ? Math.max(...yValues) - Math.min(...yValues) : 0;
  const tolerance =
    yTolerance ??
    (yRange > 100 ? yRange / 200 : Math.max(yRange / 80, 0.15)); // stricter grouping so table rows don't merge
  const lines = [];
  let currentY = withY[0].y;
  let currentLine = [];
  for (const item of withY) {
    if (item.text === '') continue;
    if (Math.abs(item.y - currentY) <= tolerance) {
      currentLine.push({ x: item.x, text: item.text });
    } else {
      if (currentLine.length) {
        currentLine.sort((a, b) => a.x - b.x);
        lines.push({ y: currentY, cells: currentLine.map((c) => c.text) });
      }
      currentY = item.y;
      currentLine = [{ x: item.x, text: item.text }];
    }
  }
  if (currentLine.length) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push({ y: currentY, cells: currentLine.map((c) => c.text) });
  }
  return lines;
}

/**
 * Heuristic: does this line look like a table header? (e.g. contains Codigo, Denominacion, Cantidad, etc.)
 * @param {string[]} cells
 * @returns {boolean}
 */
function looksLikeTableHeader(cells) {
  const joined = cells.join(' ').toLowerCase();
  const normalized = joined.normalize('NFD').replace(/\u0301/g, ''); // remove accents for matching
  const keywords = ['codigo', 'código', 'code', 'referencia', 'ref.', 'denominacion', 'denominación', 'descripcion', 'description', 'cantidad', 'qty', 'precio', 'total', 'unidad', 'ud'];
  let matches = 0;
  for (const k of keywords) {
    const kNorm = k.normalize('NFD').replace(/\u0301/g, '');
    if (joined.includes(k) || normalized.includes(kNorm)) matches++;
  }
  return matches >= 2;
}

/** Prefer a line that looks like the main table header: has Ref/Referencia and Denominación/Description. */
function looksLikeMainTableHeader(cells) {
  const joined = cells.join(' ').toLowerCase();
  const hasRef = /\bref\.?\b|referencia/i.test(joined);
  const hasDenom = /denominaci[oó]n|description|descripcion/i.test(joined);
  const hasUd = /\bud\.?\b|unidad|cantidad/i.test(joined);
  return (hasRef || hasDenom) && (hasRef && (hasDenom || hasUd) || (hasDenom && hasUd));
}

/**
 * Heuristic: is this line likely a data row? (has at least 2 cells, not a header keyword line)
 * @param {string[]} cells
 * @param {string[]} headerCells
 * @returns {boolean}
 */
function looksLikeDataRow(cells, headerCells) {
  if (cells.length < 2) return false;
  const joined = cells.join(' ').toLowerCase();
  if (looksLikeTableHeader(cells) && cells.length <= headerCells.length) return false;
  return true;
}

/**
 * Build lines from raw text (fallback when all Texts share same y).
 * Split by newlines, then each line by multiple spaces/tabs to get cells.
 */
function rawTextToLines(rawText) {
  const lines = [];
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cells = trimmed.split(/\t+| {2,}/).map((c) => c.trim()).filter(Boolean);
    if (cells.length) lines.push({ y: 0, cells });
  }
  return lines;
}

/** Skip repeated page header lines (e.g. "Pág.", "LISTADO DE COMPOSICIONES"). */
function isRepeatedHeaderLine(cells) {
  const joined = cells.join(' ').toLowerCase();
  return /pág\.|listado de composiciones|denominación técnica\s*$/i.test(joined) && cells.length <= 3;
}

/** Match PDF page break line: ----------------Page (0) Break---------------- */
const PAGE_BREAK_REGEX = /-+\s*Page\s*\(\d+\)\s*Break\s*-+/;

function getLineRaw(line) {
  return line.raw != null ? line.raw : (line.cells ? line.cells.join(' | ') : String(line));
}

function isPageBreakLine(line) {
  const raw = getLineRaw(line);
  return PAGE_BREAK_REGEX.test(raw.trim());
}

/** Component start: line begins with a letter and a reference like 202.07.162 (e.g. "T 145.82.005", "M 100.07.613"). */
const COMPONENT_START_REGEX = /^[A-Z]\s+\d+\.\d+\.\d+/;

function isComponentStartLine(line) {
  const raw = getLineRaw(line).trim();
  return COMPONENT_START_REGEX.test(raw);
}

/** Fixed layout: L1-2 ignore, L3 ignore, L4 company, L5 id|date|time, L6 title, L7 armario id|desc, L8-9 ignore, L10 peso, L11-18 header, L19+ components. Each component starts with a line matching letter + ref (e.g. T 145.82.005); all lines until the next such start (or page break) belong to that component. After page break line, skip that line and the next 12. */
function parseArmarioByPattern(rawLines) {
  const head = {
    companyName: '',
    identifierDateTime: '',
    pageTitle: '',
    armarioIdDesc: '',
    pesoNetoCal: '',
  };
  let tableHeader = [];
  const components = [];
  /** @type {{ lineIndex: number, role: string, raw: string }[]} */
  const parseLines = [];
  let i = 0;
  let firstBlock = true;
  let lineIndex = 0;

  function pushRole(role, raw) {
    lineIndex++;
    parseLines.push({ lineIndex, role, raw });
  }

  while (i < rawLines.length) {
    if (isPageBreakLine(rawLines[i])) {
      pushRole('page_break_skip', getLineRaw(rawLines[i]));
      for (let s = 1; s < 13 && i + s < rawLines.length; s++) pushRole('page_break_skip', getLineRaw(rawLines[i + s]));
      i += 13;
      continue; // after skip, continue reading components (no new L1-18 block)
    }
    if (firstBlock && i + 18 <= rawLines.length) {
      pushRole('ignore', getLineRaw(rawLines[i]));
      pushRole('ignore', getLineRaw(rawLines[i + 1]));
      i += 2; // L1-2
      pushRole('ignore', getLineRaw(rawLines[i]));
      i += 1; // L3
      head.companyName = getLineRaw(rawLines[i]);
      head.identifierDateTime = getLineRaw(rawLines[i + 1]);
      head.pageTitle = getLineRaw(rawLines[i + 2]);
      head.armarioIdDesc = getLineRaw(rawLines[i + 3]);
      pushRole('head', getLineRaw(rawLines[i]));
      pushRole('head', getLineRaw(rawLines[i + 1]));
      pushRole('head', getLineRaw(rawLines[i + 2]));
      pushRole('head', getLineRaw(rawLines[i + 3]));
      i += 4; // L4-L7
      pushRole('ignore', getLineRaw(rawLines[i]));
      pushRole('ignore', getLineRaw(rawLines[i + 1]));
      i += 2; // L8-9
      head.pesoNetoCal = getLineRaw(rawLines[i]);
      pushRole('head', getLineRaw(rawLines[i]));
      i += 1; // L10
      tableHeader = [];
      for (let k = 0; k < 8; k++) {
        tableHeader.push(getLineRaw(rawLines[i + k]));
        pushRole('table_header', getLineRaw(rawLines[i + k]));
      }
      i += 8; // L11-18
      firstBlock = false;
    }
    while (i < rawLines.length && !isPageBreakLine(rawLines[i])) {
      if (!isComponentStartLine(rawLines[i])) {
        pushRole('component', getLineRaw(rawLines[i]));
        i++;
        continue;
      }
      const chunk = [];
      while (i < rawLines.length && !isPageBreakLine(rawLines[i])) {
        const raw = getLineRaw(rawLines[i]);
        chunk.push(raw);
        pushRole('component', raw);
        i++;
        if (i < rawLines.length && !isPageBreakLine(rawLines[i]) && isComponentStartLine(rawLines[i])) break;
      }
      if (chunk.length > 0) {
        components.push({
          lines: chunk,
          merged: chunk.join('\n'),
        });
      }
      if (i < rawLines.length && isPageBreakLine(rawLines[i])) break;
    }
  }

  return { head, tableHeader, components, parseLines: { source: 'pattern', lines: parseLines } };
}

export function parseArmarioPdf(pdfPath, options = {}) {
  const columnMapPath = options.columnMapPath;
  const skipFirstLinesPage1 = options.skipFirstLinesPage1 ?? 0;
  const skipLinesContinuation = options.skipLinesContinuation ?? 0;

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1); // needRawText=1 for getRawTextContent
    pdfParser.on('pdfParser_dataError', (err) => reject(err.parserError || err));
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        const pages = pdfData.Pages || [];
        const rawText = typeof pdfParser.getRawTextContent === 'function' ? pdfParser.getRawTextContent() : '';
        const rawLines = rawText ? rawTextToLines(rawText) : [];

        let head = [];
        let headerRow = null;
        let tableHeaderLines = [];
        const components = [];
        const columnMap = loadColumnMap(columnMapPath);

        const posLines = pages.length && pages[0].Texts ? pageToLines(pages[0].Texts, 8) : [];
        const useRawText = rawLines.length > 10 && (posLines.length === 0 || (posLines.length === 1 && posLines[0].cells.length > 20));

        /** @type {{ lineIndex: number, role: string, cells: string[], raw: string }[]} */
        const parseLines = [];
        /** @type { { source: string, lines: object[] } | null } */
        let parseLinesResult = null;

        if (useRawText && rawLines.length > 0) {
          const patternResult = parseArmarioByPattern(rawLines);
          head = patternResult.head;
          tableHeaderLines = patternResult.tableHeader || [];
          headerRow = tableHeaderLines.length > 0 ? ['merged'] : [];
          components.length = 0;
          patternResult.components.forEach((c) => components.push({ merged: c.merged, lines: c.lines }));
          parseLinesResult = patternResult.parseLines;
        } else {
          for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const page = pages[pageIndex];
            const lines = pageToLines(page.Texts || [], 8);
            if (lines.length === 0) continue;

            if (pageIndex === 0) {
              let tableHeaderIndex = -1;
              for (let i = skipFirstLinesPage1; i < lines.length; i++) {
                if (looksLikeMainTableHeader(lines[i].cells) || looksLikeTableHeader(lines[i].cells)) {
                  tableHeaderIndex = i;
                  headerRow = lines[i].cells;
                  break;
                }
              }
              head = lines.slice(0, tableHeaderIndex >= 0 ? tableHeaderIndex : 0).map((l) => l.cells.join(' | '));
              const dataStart = tableHeaderIndex >= 0 ? tableHeaderIndex + 1 : skipFirstLinesPage1;
              for (let i = 0; i < lines.length; i++) {
                const cells = lines[i].cells;
                const raw = cells.join(' | ');
                let role = 'data';
                if (i < dataStart) role = i === tableHeaderIndex ? 'table_header' : 'head';
                else if (!headerRow || !looksLikeDataRow(cells, headerRow)) role = 'skipped';
                parseLines.push({ lineIndex: parseLines.length + 1, pageIndex: pageIndex + 1, role, cells, raw });
                if (i >= dataStart && headerRow && looksLikeDataRow(cells, headerRow)) {
                  const row = {};
                  headerRow.forEach((h, j) => {
                    const key = columnMap[h] || h;
                    row[key] = cells[j] !== undefined ? cells[j] : '';
                  });
                  components.push(row);
                }
              }
            } else {
              const skip = skipLinesContinuation > 0 ? skipLinesContinuation : (headerRow ? findContinuationSkip(lines, headerRow) : 0);
              for (let i = 0; i < lines.length; i++) {
                const cells = lines[i].cells;
                const raw = cells.join(' | ');
                const isData = i >= skip && headerRow && looksLikeDataRow(cells, headerRow);
                const role = i < skip ? 'skipped' : isData ? 'data' : 'skipped';
                parseLines.push({ lineIndex: parseLines.length + 1, pageIndex: pageIndex + 1, role, cells, raw });
                if (isData) {
                  const row = {};
                  headerRow.forEach((h, j) => {
                    const key = columnMap[h] || h;
                    row[key] = cells[j] !== undefined ? cells[j] : '';
                  });
                  components.push(row);
                }
              }
            }
          }
        }

        if (!useRawText && headerRow && headerRow.length > 0) {
          tableHeaderLines = [headerRow.join(' | ')];
        }
        resolve({
          head: useRawText ? head : (Array.isArray(head) && head.length ? head : { lines: head }),
          components,
          headerRow: headerRow || [],
          tableHeaderLines,
          parseLines: parseLinesResult || { source: 'position', lines: parseLines },
        });
      } catch (e) {
        reject(e);
      }
    });
    pdfParser.loadPDF(pdfPath).catch(reject);
  });
}

/**
 * On continuation pages, find how many lines to skip (repeated head + header).
 * We skip until we find a line that looks like a data row (not a header).
 * @param {{ y: number, cells: string[] }[]} lines
 * @param {string[]} headerRow
 * @returns {number}
 */
function findContinuationSkip(lines, headerRow) {
  for (let i = 0; i < lines.length; i++) {
    if (looksLikeTableHeader(lines[i].cells)) continue;
    if (looksLikeDataRow(lines[i].cells, headerRow)) return i;
  }
  return lines.length;
}

/**
 * Map component row to armario header keys (Codigo, Denominacion, etc.).
 * @param {object} row
 * @param {string[]} armarioHeader
 * @returns {object}
 */
function toArmarioRow(row, armarioHeader = ARMARIO_HEADER) {
  const out = {};
  for (const key of armarioHeader) {
    out[key] = row[key] ?? '';
  }
  return out;
}

/**
 * Write JSON file (head + components).
 */
function writeJson(outPath, head, components) {
  fs.writeFileSync(outPath, JSON.stringify({ head, components }, null, 2), 'utf8');
}

/**
 * Write CSV file (components only).
 */
function writeCsv(outPath, components, headerRow) {
  const headers = headerRow && headerRow.length > 0 ? headerRow : (components[0] ? Object.keys(components[0]) : []);
  const rows = [headers];
  for (const row of components) {
    rows.push(headers.map((h) => (row[h] !== undefined ? String(row[h]) : '')));
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  fs.writeFileSync(outPath, csv, 'utf8');
}

/**
 * Write Markdown file (head section + component table).
 */
function writeMarkdown(outPath, head, components, headerRow) {
  const lines = [];
  lines.push('# Armario component list\n');
  if (head && (Array.isArray(head) ? head.length : Object.keys(head).length)) {
    lines.push('## Head\n');
    if (Array.isArray(head)) {
      head.forEach((line) => lines.push(typeof line === 'string' ? line : String(line)));
    } else {
      lines.push(JSON.stringify(head, null, 2));
    }
    lines.push('\n## Components\n');
  }
  const headers = headerRow && headerRow.length > 0 ? headerRow : (components[0] ? Object.keys(components[0]) : []);
  if (headers.length) {
    lines.push('| ' + headers.join(' | ') + ' |');
    lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');
    for (const row of components) {
      const cells = headers.map((h) => (row[h] !== undefined ? String(row[h]) : '').replace(/\|/g, '\\|'));
      lines.push('| ' + cells.join(' | ') + ' |');
    }
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Write self-contained HTML (head + components). No external CSS/JS.
 * @param {string} outPath - Output path for .html file
 * @param {object|string[]} head - Head data (object with keys or array of lines)
 * @param {object[]} components - Array of { merged?, lines? } or row objects
 * @param {string[]} headerRow - Optional column headers
 * @param {string[]} tableHeaderLines - Optional table header lines (e.g. 8 lines from pattern)
 */
function writeHtml(outPath, head, components, headerRow, tableHeaderLines = []) {
  const hasHead = head && (Array.isArray(head) ? head.length > 0 : Object.keys(head).length > 0);
  const headLabels = { companyName: 'Company', identifierDateTime: 'Identifier / Date / Time', pageTitle: 'Page title', armarioIdDesc: 'Armario ID / Description', pesoNetoCal: 'Peso Neto / Peso Cal.' };

  const parts = [];
  parts.push('<!DOCTYPE html>');
  parts.push('<html lang="es">');
  parts.push('<head>');
  parts.push('<meta charset="utf-8">');
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  parts.push('<title>Armario component list</title>');
  parts.push('<style>');
  parts.push('* { box-sizing: border-box; }');
  parts.push('body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 960px; margin: 0 auto; padding: 1rem 1.5rem; color: #1a1a1a; background: #f8f9fa; }');
  parts.push('h1 { font-size: 1.5rem; margin: 0 0 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }');
  parts.push('h2 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; color: #333; }');
  parts.push('.head-block { background: #fff; border: 1px solid #dee2e6; border-radius: 6px; padding: 1rem 1.25rem; margin-bottom: 1rem; }');
  parts.push('.head-block dl { margin: 0; display: grid; gap: 0.35rem 1rem; grid-template-columns: auto 1fr; }');
  parts.push('.head-block dt { font-weight: 600; color: #495057; }');
  parts.push('.head-block dd { margin: 0; }');
  parts.push('.table-header { background: #e9ecef; padding: 0.5rem 1rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem; }');
  parts.push('.table-header-line { margin: 0.2rem 0; }');
  parts.push('.components { display: flex; flex-direction: column; gap: 0.75rem; }');
  parts.push('.component { background: #fff; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; }');
  parts.push('.component-ref { font-weight: 600; padding: 0.5rem 1rem; background: #e9ecef; border-bottom: 1px solid #dee2e6; font-size: 0.95rem; }');
  parts.push('.component-content { padding: 0.75rem 1rem; font-size: 0.875rem; white-space: pre-wrap; word-break: break-word; }');
  parts.push('</style>');
  parts.push('</head>');
  parts.push('<body>');
  parts.push('<h1>Armario component list</h1>');

  if (hasHead) {
    parts.push('<h2>Datos del documento</h2>');
    parts.push('<div class="head-block">');
    if (Array.isArray(head)) {
      parts.push('<dl>');
      head.forEach((line, idx) => {
        parts.push(`<dt>Línea ${idx + 1}</dt><dd>${escapeHtml(typeof line === 'string' ? line : String(line))}</dd>`);
      });
      parts.push('</dl>');
    } else {
      parts.push('<dl>');
      for (const [key, label] of Object.entries(headLabels)) {
        if (head[key] != null && head[key] !== '') {
          parts.push(`<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(head[key])}</dd>`);
        }
      }
      parts.push('</dl>');
    }
    parts.push('</div>');
  }

  if (tableHeaderLines && tableHeaderLines.length > 0) {
    parts.push('<h2>Cabecera de tabla</h2>');
    parts.push('<div class="table-header">');
    tableHeaderLines.forEach((line) => parts.push(`<div class="table-header-line">${escapeHtml(line)}</div>`));
    parts.push('</div>');
  } else if (headerRow && headerRow.length > 0 && headerRow[0] !== 'merged') {
    parts.push('<h2>Cabecera de tabla</h2>');
    parts.push(`<div class="table-header">${headerRow.map((h) => escapeHtml(h)).join(' &middot; ')}</div>`);
  }

  parts.push('<h2>Componentes</h2>');
  parts.push('<div class="components">');

  for (let i = 0; i < components.length; i++) {
    const c = components[i];
    let ref = '';
    let content = '';
    if (c.merged != null && c.lines != null) {
      ref = c.lines[0] != null ? c.lines[0] : '';
      content = c.merged;
    } else if (c.merged != null) {
      ref = String(c.merged).split('\n')[0] || '';
      content = c.merged;
    } else if (typeof c === 'object') {
      const keys = Object.keys(c);
      ref = keys.length ? String(c[keys[0]]) : '';
      content = keys.map((k) => `${k}: ${c[k]}`).join('\n');
    }
    parts.push('<div class="component">');
    parts.push(`<div class="component-ref">${escapeHtml(ref)}</div>`);
    parts.push(`<div class="component-content">${escapeHtml(content)}</div>`);
    parts.push('</div>');
  }

  parts.push('</div>');
  parts.push('</body>');
  parts.push('</html>');
  fs.writeFileSync(outPath, parts.join('\n'), 'utf8');
}

/**
 * Write line-by-line parse output: JSON (full) and .txt (human-readable).
 * Writes {basePath}.lines.json and {basePath}.lines.txt.
 * @param {string} basePath - Output basename (e.g. /tmp/out → /tmp/out.lines.json, /tmp/out.lines.txt)
 * @param {{ source: string, lines: { lineIndex: number, role?: string, cells: string[], raw: string, pageIndex?: number }[] }} parseLines
 */
function writeParseLines(basePath, parseLines) {
  fs.writeFileSync(basePath + '.lines.json', JSON.stringify(parseLines, null, 2), 'utf8');
  const txtLines = [
    '# Line-by-line parse of PDF',
    `# Source: ${parseLines.source}`,
    '',
    ...parseLines.lines.map((l) => {
      const page = l.pageIndex != null ? ` [page ${l.pageIndex}]` : '';
      const rolePart = l.role != null ? ` ${l.role.padEnd(14)} |` : '';
      return `${String(l.lineIndex).padStart(5)} |${rolePart} ${l.raw}${page}`;
    }),
  ];
  fs.writeFileSync(basePath + '.lines.txt', txtLines.join('\n'), 'utf8');
}

/**
 * Write lines-only output (no role column). Same filenames .lines.json and .lines.txt.
 * @param {string} basePath - Output basename
 * @param {{ source: string, lines: { lineIndex: number, cells: string[], raw: string, pageIndex?: number }[] }} result
 */
function writeLinesOnly(basePath, result) {
  fs.writeFileSync(basePath + '.lines.json', JSON.stringify(result, null, 2), 'utf8');
  const txtLines = [
    '# PDF line-by-line (parse only, no extraction)',
    `# Source: ${result.source}`,
    '',
    ...result.lines.map((l) => {
      const page = l.pageIndex != null ? ` [page ${l.pageIndex}]` : '';
      return `${String(l.lineIndex).padStart(5)} | ${l.raw}${page}`;
    }),
  ];
  fs.writeFileSync(basePath + '.lines.txt', txtLines.join('\n'), 'utf8');
}

/**
 * Parse PDF to lines only (no head/table extraction). Returns every line with lineIndex, cells, raw.
 * @param {string} pdfPath
 * @returns {Promise<{ source: string, lines: { lineIndex: number, cells: string[], raw: string, pageIndex?: number }[] }>}
 */
export function parsePdfToLinesOnly(pdfPath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on('pdfParser_dataError', (err) => reject(err.parserError || err));
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        const pages = pdfData.Pages || [];
        const rawText = typeof pdfParser.getRawTextContent === 'function' ? pdfParser.getRawTextContent() : '';
        const rawLines = rawText ? rawTextToLines(rawText) : [];
        const posLines = pages.length && pages[0].Texts ? pageToLines(pages[0].Texts, 8) : [];
        const useRawText = rawLines.length > 10 && (posLines.length === 0 || (posLines.length === 1 && posLines[0].cells.length > 20));

        /** @type {{ lineIndex: number, cells: string[], raw: string, pageIndex?: number }[]} */
        const lines = [];

        if (useRawText && rawLines.length > 0) {
          rawLines.forEach((l, i) => {
            const raw = l.cells.join(' | ');
            lines.push({ lineIndex: i + 1, cells: l.cells, raw });
          });
          resolve({ source: 'raw', lines });
        } else {
          let lineIndex = 0;
          for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const page = pages[pageIndex];
            const pageLines = pageToLines(page.Texts || [], 8);
            for (const l of pageLines) {
              lineIndex++;
              const raw = l.cells.join(' | ');
              lines.push({ lineIndex, cells: l.cells, raw, pageIndex: pageIndex + 1 });
            }
          }
          resolve({ source: 'position', lines });
        }
      } catch (e) {
        reject(e);
      }
    });
    pdfParser.loadPDF(pdfPath).catch(reject);
  });
}

/**
 * Write armario-format XLSX (sheet "componentes", header row, data from row 3).
 */
function writeXlsx(outPath, components) {
  const armarioRows = components.map((row) => toArmarioRow(row));
  const ws = XLSX.utils.json_to_sheet(armarioRows, { header: ARMARIO_HEADER });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'componentes');
  XLSX.writeFile(wb, outPath);
}

/**
 * Resolve output path: if it's a directory, use input basename; else use as basename.
 * @param {string} inputPath - PDF path
 * @param {string} outputPath - -o argument
 * @returns {{ dir: string, basename: string }}
 */
function resolveOutputPaths(inputPath, outputPath) {
  const inputBasename = path.basename(inputPath, path.extname(inputPath));
  const stat = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
  if (stat && stat.isDirectory()) {
    return { dir: outputPath, basename: path.join(outputPath, inputBasename) };
  }
  const dir = path.dirname(outputPath);
  const basename = path.extname(outputPath) ? path.join(dir, path.basename(outputPath, path.extname(outputPath))) : path.join(dir, path.basename(outputPath));
  return { dir: dir, basename };
}

/**
 * Extract armario from PDF and write JSON, CSV, Markdown, and optionally XLSX.
 * @param {string} inputPath - Path to armario PDF
 * @param {string} outputPath - -o value: directory or basename
 * @param {object} [options] - { xlsx: boolean, columnMapPath: string }
 * @returns {Promise<{ head: any, components: object[] }>}
 */
export async function extractArmarioFromPdf(inputPath, outputPath, options = {}) {
  const { xlsx = false, columnMapPath, lines = false, html = false } = options;
  const { basename } = resolveOutputPaths(inputPath, outputPath);

  const { head, components, headerRow, tableHeaderLines, parseLines } = await parseArmarioPdf(inputPath, { columnMapPath });

  writeJson(basename + '.json', head, components);
  writeCsv(basename + '.csv', components, headerRow);
  writeMarkdown(basename + '.md', head, components, headerRow);
  if (xlsx) writeXlsx(basename + '.xlsx', components);
  if (html) writeHtml(basename + '.html', head, components, headerRow, tableHeaderLines);
  if (lines && parseLines) writeParseLines(basename, parseLines);

  return { head, components, parseLines };
}

/**
 * Parse PDF to lines only and write .lines.json and .lines.txt. No head/components extraction.
 * @param {string} inputPath - Path to armario PDF
 * @param {string} outputPath - -o value: directory or basename
 * @returns {Promise<{ source: string, lines: object[] }>}
 */
export async function extractArmarioLinesOnly(inputPath, outputPath) {
  const { basename } = resolveOutputPaths(inputPath, outputPath);
  const result = await parsePdfToLinesOnly(inputPath);
  writeLinesOnly(basename, result);
  return result;
}
