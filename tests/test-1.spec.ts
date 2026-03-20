import { test, expect, type Page } from '@playwright/test';

const toNumber = (value: string | undefined, fallback: number) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const timeoutMs = toNumber(process.env.PLAYWRIGHT_TIMEOUT_MS, 15000);
const longTimeoutMs = timeoutMs * 2;
const settleDelayMs = Math.max(250, Math.round(timeoutMs / 30));

async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');

  const ionApp = page.locator('ion-app').first();
  if (await ionApp.count()) {
    await expect(ionApp).toHaveClass(/hydrated/, { timeout: timeoutMs });
  }

  await expect(
    page.locator('ion-loading:not(.overlay-hidden), ion-spinner').first(),
  ).toBeHidden({ timeout: timeoutMs });
}

test('NO CODE STUDIO', async ({ page, context }) => {
  const form_name = 'QA - GV - HLOAD';
  const grid_value = 'Human Resources';

  // LOGIN
  await page.goto("index.html");
  await expect(page.locator('ion-button[type=submit].class1645091280806')).toBeVisible({ timeout: timeoutMs });
  await page.locator('#ion-input-1').fill(process.env.LOGIN || 'login');
  await page.waitForTimeout(settleDelayMs);
  //await page.locator('ion-button[type=submit].class1645091280824').click();
  //await page.waitForTimeout(settleDelayMs);
  await page.locator('#ion-input-0').fill(process.env.PASSWORD || 'password');
  await page.waitForTimeout(settleDelayMs);
  await page.locator('ion-button[type=submit].class1645091280806').click();

  // RESULTS DASHBOARD
  await expect(page.locator('ion-label.class1645887457900')).toBeAttached({ timeout: timeoutMs });

  // DASHBOARD: CLICK PUBLISHED APPS
  await expect(page.locator('div.class1645545973630.TabNotSelected')).toBeAttached({ timeout: timeoutMs });
  await page.locator('div.class1645545973630.TabNotSelected').click();
  await expect(page.locator('div.class1645545973630.TabSelected')).toBeAttached({ timeout: timeoutMs });

  // CLICK APP
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByText(form_name).locator('..').click()
  ]);

  await waitForAppReady(newPage);

  // GRID
  await expect(
    newPage.locator('div.ion-text-wrap.class1584610404188').filter({ hasText: form_name }),
  ).toBeVisible({ timeout: longTimeoutMs });
  await expect(newPage.getByText(grid_value).nth(0)).toBeAttached({ timeout: timeoutMs });
  await expect(newPage.getByText(grid_value).nth(1)).toBeAttached({ timeout: timeoutMs });

  // CHART
  await expect(newPage.locator('g[seriesName="t_avg_c"]')).toBeAttached({ timeout: timeoutMs });

  //newPage.close();
  //page.close();
});
