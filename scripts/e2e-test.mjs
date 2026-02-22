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
  const failedRequests = [];
  let passed = true;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText || 'unknown',
    });
  });

  try {
    const response = await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    if (!response || !response.ok()) {
      console.error('FAIL: Page load failed', response?.status());
      passed = false;
    } else {
      console.log('OK: Page loaded', response.status());
    }

    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log('Title:', title || '(empty)');

    const hasContent = await page.locator('body').count() > 0;
    if (!hasContent) {
      console.error('FAIL: No body content');
      passed = false;
    } else {
      console.log('OK: Body present');
    }

    if (consoleErrors.length > 0) {
      console.log('\n--- Console errors ---');
      consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      passed = false;
    }

    if (failedRequests.length > 0) {
      console.log('\n--- Failed requests ---');
      failedRequests.forEach((r, i) => console.log(`  ${i + 1}. ${r.url} - ${r.failure}`));
      passed = false;
    }
  } catch (err) {
    console.error('FAIL:', err.message);
    passed = false;
  } finally {
    await browser.close();
  }

  process.exit(passed ? 0 : 1);
}

run();
