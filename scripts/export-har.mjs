import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const login = process.env.LOGIN ?? 'admin';
const password = process.env.PASSWORD ?? 'admin';
const baseUrl =
  process.env.BASE_URL ??
  'https://toulouse-m-dev.convertigo.com/convertigo/projects/C8Oforms/DisplayObjects/mobile/';
const outDir = process.env.OUT_DIR ?? path.resolve('artifacts');
const harPath =
  process.env.HAR_PATH ?? path.join(outDir, 'convertigo-dev-one-user.har');
const screenshotPath =
  process.env.SCREENSHOT_PATH ?? path.join(outDir, 'convertigo-dev-one-user.png');
const errorScreenshotPath =
  process.env.ERROR_SCREENSHOT_PATH ??
  path.join(outDir, 'convertigo-dev-one-user-error.png');
const htmlDumpPath =
  process.env.HTML_DUMP_PATH ?? path.join(outDir, 'convertigo-dev-one-user.html');
const timeoutMs = Number(process.env.PLAYWRIGHT_TIMEOUT_MS ?? 60000);
const settleDelayMs = Math.max(250, Math.round(timeoutMs / 30));

fs.mkdirSync(outDir, { recursive: true });

async function waitForAppReady(page) {
  await page.waitForLoadState('domcontentloaded');

  const ionApp = page.locator('ion-app').first();
  if (await ionApp.count()) {
    await expect(ionApp).toHaveClass(/hydrated/, { timeout: timeoutMs });
  }

  await expect(
    page.locator('ion-loading:not(.overlay-hidden), ion-spinner').first(),
  ).toBeHidden({ timeout: timeoutMs });
}

const browser = await chromium.launch({ headless: false, slowMo: 100 });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  recordHar: {
    path: harPath,
    mode: 'full',
    content: 'embed',
  },
});

const page = await context.newPage();

try {
  console.log(`Opening ${baseUrl}`);
  await page.goto(new URL('index.html', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMs,
  });

  await expect(page.locator('ion-button[type=submit].class1645091280806')).toBeVisible({
    timeout: timeoutMs,
  });
  await page.locator('#ion-input-1').fill(login);
  await page.waitForTimeout(settleDelayMs);
  await page.locator('#ion-input-0').fill(password);
  await page.waitForTimeout(settleDelayMs);
  await page.locator('ion-button[type=submit].class1645091280806').click();

  await expect(page.locator('ion-label.class1645887457900')).toBeAttached({
    timeout: timeoutMs,
  });
  await expect(page.locator('div.class1645545973630.TabNotSelected')).toBeAttached({
    timeout: timeoutMs,
  });
  await page.locator('div.class1645545973630.TabNotSelected').click();
  await expect(page.locator('div.class1645545973630.TabSelected')).toBeAttached({
    timeout: timeoutMs,
  });

  const pagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  const currentUrl = page.url();
  await page.getByText('QA - GV - HLOAD').locator('..').click();

  let newPage = await pagePromise;
  if (!newPage) {
    await Promise.race([
      page.waitForURL((url) => url.toString() !== currentUrl, { timeout: timeoutMs }).catch(() => null),
      page.getByText('Human Resources').nth(0).waitFor({ timeout: timeoutMs }).catch(() => null),
    ]);
    newPage = page;
  }

  await waitForAppReady(newPage);
  await expect(
    newPage.locator('div.ion-text-wrap.class1584610404188').filter({
      hasText: 'QA - GV - HLOAD',
    }),
  ).toBeVisible({ timeout: timeoutMs * 2 });
  await expect(newPage.getByText('Human Resources').nth(0)).toBeAttached({
    timeout: timeoutMs,
  });
  await expect(newPage.getByText('Human Resources').nth(1)).toBeAttached({
    timeout: timeoutMs,
  });
  await expect(newPage.locator('g[seriesName="t_avg_c"]')).toBeAttached({
    timeout: timeoutMs,
  });

  await newPage.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`HAR saved to ${harPath}`);
  console.log(`Screenshot saved to ${screenshotPath}`);
} catch (error) {
  await page.screenshot({ path: errorScreenshotPath, fullPage: true }).catch(() => {});
  fs.writeFileSync(htmlDumpPath, await page.content().catch(() => '<unavailable>'));
  console.error(`Error screenshot saved to ${errorScreenshotPath}`);
  console.error(`HTML dump saved to ${htmlDumpPath}`);
  throw error;
} finally {
  await context.close();
  await browser.close();
}
