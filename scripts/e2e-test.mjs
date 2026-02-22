#!/usr/bin/env node
/**
 * Playwright e2e test for Zenbat app.
 * Run: npx playwright test scripts/e2e-test.mjs
 * Or: node scripts/e2e-test.mjs (with playwright installed)
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function run() {
  const consoleErrors = [];
  const consoleWarnings = [];
  const failedRequests = [];
  const badStatusRequests = []; // 4xx, 5xx responses
  const uncaughtErrors = [];
  let passed = true;

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
    // Log all for debugging
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

  try {
    const response = await page.goto(BASE_URL, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });

    if (!response || !response.ok()) {
      console.error('FAIL: Page load failed', response?.status());
      passed = false;
    } else {
      console.log('OK: Page loaded', response.status());
    }

    await page.waitForTimeout(5000);

    const title = await page.title();
    console.log('Title:', title || '(empty)');

    const hasContent = await page.locator('body').count() > 0;
    if (!hasContent) {
      console.error('FAIL: No body content');
      passed = false;
    } else {
      console.log('OK: Body present');
    }

    if (consoleWarnings.length > 0) {
      console.log('\n--- Console warnings ---');
      consoleWarnings.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    // Explicit assertion: console must have no errors
    const totalConsoleErrors = consoleErrors.length + uncaughtErrors.length;
    if (totalConsoleErrors > 0) {
      console.log('\n--- Console errors ---');
      consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      if (uncaughtErrors.length > 0) {
        console.log('\n--- Uncaught exceptions (count as console errors) ---');
        uncaughtErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      }
      console.error(`\nFAIL: Console has ${totalConsoleErrors} error(s) (expected 0)`);
      passed = false;
    } else {
      console.log('\nOK: Console has no errors');
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

    // Write full report for inspection
    const report = {
      consoleErrors,
      consoleWarnings,
      failedRequests,
      badStatusRequests,
      uncaughtErrors,
      title: await page.title(),
    };
    const fs = await import('fs');
    fs.writeFileSync('e2e-browser-report.json', JSON.stringify(report, null, 2));
    console.log('\nReport written to e2e-browser-report.json');
    console.log(passed ? '\n=== All checks passed (including: console has no errors) ===' : '\n=== FAILED ===');
  } catch (err) {
    console.error('FAIL:', err.message);
    passed = false;
  } finally {
    await browser.close();
  }

  process.exit(passed ? 0 : 1);
}

run();
