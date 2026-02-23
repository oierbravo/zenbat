#!/usr/bin/env node

/**
 * Zenbat CLI – inventory and manufacturing.
 * Usage: zenbat [command] [subcommand] [options]
 * Example: zenbat generate armario <input.pdf> -o <output>
 *          zenbat start --port 3000
 *          zenbat dev
 */

import { program } from 'commander';
import { extractArmarioFromPdf, extractArmarioLinesOnly } from '../lib/extract-armario-pdf.mjs';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const serverDir = path.join(repoRoot, 'server');
const clientDir = path.join(repoRoot, 'client');

program
  .name('zenbat')
  .description('Zenbat CLI – inventory and manufacturing')
  .version('0.0.1');

const START_MODES = ['server', 'angular', 'react'];

function modeToFrontend(mode) {
  return mode === 'server' ? 'standalone' : mode;
}

function parseFrontendOption(options) {
  if (options.react) return 'react';
  if (options.angular) return 'angular';
  return (options.frontend || 'standalone').toLowerCase();
}

function spawnServer(env = {}) {
  return spawn('node', ['server.js'], {
    cwd: serverDir,
    env: { ...process.env, NODE_ENV: 'development', ...env },
    stdio: 'inherit',
  });
}

function showStartHelp() {
  console.log(`
zenbat start <mode> [options]

Start the Zenbat API server. The <mode> argument is required.

Modes:
  server   API only (standalone). No frontend is served; API responds with JSON.
  angular  Serve the Angular frontend. Use when working with the legacy Angular app.
  react    Serve the React frontend. Requires client/dist (run "npm run build" first).

Options:
  -p, --port <number>  Port (default: 3000, or PORT env)
  -d, --data <path>   Data folder for XLSX, DB, armarios, etc. (default: ./out)

Examples:
  zenbat start server
  zenbat start server --port 4000
  zenbat start server --data ./my-data
  zenbat start angular
  zenbat start react -p 3000
`);
}

const startCmd = program
  .command('start [mode]')
  .description('Start the Zenbat API server (requires mode: server | angular | react)')
  .option('-p, --port <number>', 'Port (default: 3000)', process.env.PORT || '3000')
  .option('-d, --data <path>', 'Data folder for XLSX, DB, armarios (default: ./out)', './out')
  .action((mode, options) => {
    const m = (mode || '').toLowerCase();
    if (!m || !START_MODES.includes(m)) {
      showStartHelp();
      process.exit(1);
    }
    const port = String(options.port);
    const dataPath = path.resolve(process.cwd(), options.data);
    const frontend = modeToFrontend(m);
    const server = spawnServer({ PORT: port, ZENBAT_FRONTEND: frontend, ZENBAT_DATA_PATH: dataPath });
    server.on('exit', (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      else process.exit(code ?? 0);
    });
  });

const devCmd = program
  .command('dev')
  .description('Start API server and client dev server (server + Vite)')
  .option('-p, --port <number>', 'Server port (default: 3000)', process.env.PORT || '3000')
  .option('-d, --data <path>', 'Data folder for XLSX, DB, armarios (default: ./out)', './out')
  .option('-f, --frontend <mode>', 'Frontend mode: standalone | angular | react', 'standalone')
  .option('--angular', 'Use Angular frontend')
  .option('--react', 'Use React frontend')
  .action((options) => {
    const port = String(options.port);
    const dataPath = path.resolve(process.cwd(), options.data);
    const frontend = parseFrontendOption(options);
    const server = spawn('node', ['server.js'], {
      cwd: serverDir,
      env: { ...process.env, NODE_ENV: 'development', PORT: port, ZENBAT_FRONTEND: frontend, ZENBAT_DATA_PATH: dataPath },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const client = spawn('npm', ['run', 'dev'], {
      cwd: clientDir,
      env: process.env,
      stdio: 'inherit',
      shell: true,
    });
    const killAll = () => {
      server.kill('SIGTERM');
      client.kill('SIGTERM');
    };
    process.on('SIGINT', killAll);
    process.on('SIGTERM', killAll);
    server.stderr?.on('data', (d) => process.stderr.write(d));
    server.stdout?.on('data', (d) => process.stdout.write(d));
    server.on('exit', (code) => {
      if (code !== 0 && code !== null) client.kill('SIGTERM');
    });
    client.on('exit', (code, signal) => {
      server.kill('SIGTERM');
      process.exit(signal ? 128 + (signal === 'SIGINT' ? 2 : 15) : code ?? 0);
    });
  });

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
