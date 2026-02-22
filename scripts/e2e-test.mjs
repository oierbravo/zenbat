#!/usr/bin/env node
/**
 * Playwright e2e test for Zenbat React app.
 * Visits every route, asserts 200 response and no console errors.
 * Run: npm run test:e2e  (with backend + client build, or dev server on 3000)
 * Requires: server running on BASE_URL (e.g. npm start then node scripts/e2e-test.mjs)
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// All React routes (static; no dynamic segments so we get 200 from SPA fallback)
const ROUTES = [
  '/',
  '/reload',
  '/componentes',
  '/stock',
  '/importar-componentes',
  '/export-componentes',
  '/componentes-reload',
  '/armarios',
  '/generar-armario',
  '/pedidos',
  '/pedidos-proveedores',
  '/pedidos-proveedores/create',
  '/historial',
];

async function run() {
  const consoleErrors = [];
  const consoleWarnings = [];
  const failedRequests = [];
  const badStatusRequests = [];
  const uncaughtErrors = [];
  const routeResults = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', (err) => {
    uncaughtErrors.push(err.message + (err.stack ? '\n' + err.stack : ''));
  });

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') consoleErrors.push(text);
    else if (type === 'warning') consoleWarnings.push(text);
    if (type === 'error' || type === 'warning') process.stderr.write(`[${type}] ${text}\n`);
  });

  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText || 'unknown',
    });
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('favicon')) {
      badStatusRequests.push({ url, status });
    }
  });

  let passed = true;

  try {
    for (const route of ROUTES) {
      const url = BASE_URL + route;
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      if (!response) {
        console.error(`FAIL: ${route} - no response`);
        routeResults.push({ route, status: null, ok: false });
        passed = false;
        continue;
      }

      const status = response.status();
      const ok = response.ok();
      routeResults.push({ route, status, ok });
      if (!ok) {
        console.error(`FAIL: ${route} - HTTP ${status}`);
        passed = false;
      } else {
        console.log(`OK: ${route} - ${status}`);
      }

      await page.waitForTimeout(800);
    }

    const title = await page.title();
    console.log('\nTitle:', title || '(empty)');

    if (consoleWarnings.length > 0) {
      console.log('\n--- Console warnings ---');
      consoleWarnings.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    const totalConsoleErrors = consoleErrors.length + uncaughtErrors.length;
    if (totalConsoleErrors > 0) {
      console.log('\n--- Console errors ---');
      consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      if (uncaughtErrors.length > 0) {
        console.log('\n--- Uncaught exceptions ---');
        uncaughtErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      }
      console.error(`\nFAIL: Console has ${totalConsoleErrors} error(s) (expected 0)`);
      passed = false;
    } else {
      console.log('\nOK: No console errors');
    }

    if (badStatusRequests.length > 0) {
      console.log('\n--- Bad response status (4xx/5xx) ---');
      badStatusRequests.forEach((r, i) => console.log(`  ${i + 1}. ${r.status} ${r.url}`));
      passed = false;
    }

    if (failedRequests.length > 0) {
      console.log('\n--- Failed requests ---');
      failedRequests.forEach((r, i) => console.log(`  ${i + 1}. ${r.url} - ${r.failure}`));
      passed = false;
    }

    const report = {
      routeResults,
      consoleErrors,
      consoleWarnings,
      failedRequests,
      badStatusRequests,
      uncaughtErrors,
      title,
    };
    const fs = await import('fs');
    fs.writeFileSync('e2e-browser-report.json', JSON.stringify(report, null, 2));
    console.log('\nReport written to e2e-browser-report.json');
    console.log(passed ? '\n=== All routes 200, no console errors ===' : '\n=== FAILED ===');
  } catch (err) {
    console.error('FAIL:', err.message);
    passed = false;
  } finally {
    await browser.close();
  }

  process.exit(passed ? 0 : 1);
}

run();
