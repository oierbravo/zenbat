#!/usr/bin/env node
/**
 * E2E test: server in standalone, angular, and react modes.
 * Spawns the server with each ZENBAT_FRONTEND, hits GET /, asserts response, then kills the server.
 * Run from repo root: node scripts/e2e-server-modes.mjs
 * Requires client/dist for react mode (run npm run build first).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const serverDir = path.join(repoRoot, 'server');
const clientDist = path.join(repoRoot, 'client', 'dist', 'index.html');

const BASE_PORT = parseInt(process.env.E2E_PORT || '13700', 10);

async function waitForPort(port, maxMs = 10000) {
  const net = await import('net');
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const ok = await new Promise((resolve) => {
      const s = net.createConnection(port, '127.0.0.1', () => {
        s.destroy();
        resolve(true);
      });
      s.once('error', () => resolve(false));
      s.setTimeout(500, () => {
        s.destroy();
        resolve(false);
      });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Port ${port} not listening after ${maxMs}ms`);
}

function runServer(mode, port) {
  return spawn('node', ['server.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(port),
      ZENBAT_FRONTEND: mode,
      NODE_ENV: 'development',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function fetchRoot(port) {
  const res = await fetch(`http://127.0.0.1:${port}/`, {
    redirect: 'manual',
    headers: { Accept: 'text/html,application/json' },
  });
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  return { status: res.status, contentType, text };
}

async function testMode(mode, port) {
  const server = runServer(mode, port);
  let stderr = '';
  server.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  const exitPromise = new Promise((resolve) => {
    server.on('exit', (code, signal) => resolve({ code, signal }));
  });

  try {
    await waitForPort(port);
  } catch (err) {
    server.kill('SIGTERM');
    await exitPromise;
    throw new Error(`${mode}: server did not start: ${err.message}`);
  }

  let result;
  try {
    result = await fetchRoot(port);
  } finally {
    server.kill('SIGTERM');
    await exitPromise;
  }

  return result;
}

function assertStandalone(result) {
  if (result.status !== 200) throw new Error(`standalone: expected 200, got ${result.status}`);
  if (!result.contentType.includes('application/json'))
    throw new Error(`standalone: expected JSON, got ${result.contentType}`);
  let body;
  try {
    body = JSON.parse(result.text);
  } catch {
    throw new Error('standalone: response is not valid JSON');
  }
  if (body.zenbat !== 'API')
    throw new Error(`standalone: expected body.zenbat "API", got ${JSON.stringify(body.zenbat)}`);
}

function assertAngular(result) {
  if (result.status !== 200) throw new Error(`angular: expected 200, got ${result.status}`);
  if (!result.contentType.includes('text/html'))
    throw new Error(`angular: expected HTML, got ${result.contentType}`);
  if (!result.text.includes('<!DOCTYPE html') && !result.text.includes('<!doctype html'))
    throw new Error('angular: response does not look like HTML');
}

function assertReact(result) {
  if (result.status !== 200) throw new Error(`react: expected 200, got ${result.status}`);
  if (!result.contentType.includes('text/html'))
    throw new Error(`react: expected HTML, got ${result.contentType}`);
  if (!result.text.includes('<!doctype html') && !result.text.includes('<!DOCTYPE html'))
    throw new Error('react: response does not look like HTML');
}

async function main() {
  const modes = [
    { name: 'standalone', assert: assertStandalone },
    { name: 'angular', assert: assertAngular },
    { name: 'react', assert: assertReact },
  ];

  if (!fs.existsSync(clientDist)) {
    console.warn('Warning: client/dist/index.html not found. React mode may fail. Run: npm run build');
  }

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < modes.length; i++) {
    const { name, assert } = modes[i];
    const port = BASE_PORT + i;
    process.stdout.write(`Testing ${name} (port ${port})... `);
    try {
      const result = await testMode(name, port);
      assert(result);
      console.log('OK');
      passed++;
    } catch (err) {
      console.log('FAIL');
      console.error(`  ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
