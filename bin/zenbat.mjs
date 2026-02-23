#!/usr/bin/env node

/**
 * Zenbat CLI – inventory and manufacturing.
 * Usage: zenbat [command] [subcommand] [options]
 * Example: zenbat generate armario <input.pdf> -o <output>
 */

import { program } from 'commander';
import { extractArmarioFromPdf, extractArmarioLinesOnly } from '../lib/extract-armario-pdf.mjs';
import path from 'path';
import fs from 'fs';

program
  .name('zenbat')
  .description('Zenbat CLI – inventory and manufacturing')
  .version('0.0.1');

const generate = program.command('generate').description('Generate files from PDF or other inputs');

generate
  .command('armario <input_file>')
  .description('Extract component list from an armario PDF (head + table). Writes JSON, CSV, Markdown; optionally XLSX.')
  .requiredOption('-o, --output <path>', 'Output path: directory (writes {input_basename}.json etc.) or basename (no extension)')
  .option('--xlsx', 'Also write armario-format XLSX (sheet componentes)')
  .option('--html', 'Also write self-contained HTML (head + components)')
  .option('--lines', 'Write line-by-line parse output (.lines.json and .lines.txt) for debugging')
  .option('--column-map <path>', 'Path to column mapping JSON (PDF column names → armario header)')
  .action(async (inputFile, options) => {
    const inputPath = path.resolve(inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: input file not found: ${inputPath}`);
      process.exit(1);
    }
    const outputPath = path.resolve(options.output);
    try {
      await extractArmarioFromPdf(inputPath, outputPath, {
        xlsx: options.xlsx === true,
        html: options.html === true,
        lines: options.lines === true,
        columnMapPath: options.columnMap ? path.resolve(options.columnMap) : undefined,
      });
      const base = path.extname(outputPath) ? path.basename(outputPath, path.extname(outputPath)) : path.basename(outputPath);
      const dir = fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory() ? outputPath : path.dirname(outputPath);
      const outBase = path.join(dir, base);
      const files = [outBase + '.json', outBase + '.csv', outBase + '.md'];
      if (options.xlsx) files.push(outBase + '.xlsx');
      if (options.html) files.push(outBase + '.html');
      if (options.lines) files.push(outBase + '.lines.json', outBase + '.lines.txt');
      console.log('Wrote:', files.join(', '));
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

generate
  .command('armario-lines <input_file>')
  .description('Parse PDF line-by-line only (no head/components extraction). Writes .lines.json and .lines.txt.')
  .requiredOption('-o, --output <path>', 'Output path: directory or basename (writes {basename}.lines.json and .lines.txt)')
  .action(async (inputFile, options) => {
    const inputPath = path.resolve(inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: input file not found: ${inputPath}`);
      process.exit(1);
    }
    const outputPath = path.resolve(options.output);
    try {
      await extractArmarioLinesOnly(inputPath, outputPath);
      const base = path.extname(outputPath) ? path.basename(outputPath, path.extname(outputPath)) : path.basename(outputPath);
      const dir = fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory() ? outputPath : path.dirname(outputPath);
      const outBase = path.join(dir, base);
      console.log('Wrote:', outBase + '.lines.json', outBase + '.lines.txt');
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse();
