import { test, expect } from '@playwright/test';

test('NO CODE STUDIO', async ({ page, context }) => {

  const wFT = 500; // waitForTimeout
  const form_name = 'QA - GV - HLOAD';
  const grid_value = 'Human Resources';

  // LOGIN
  await page.goto("index.html");
  await expect(page.locator('ion-button[type=submit].class1645091280806')).toBeVisible({ timeout: 15000 });
  await page.locator('#ion-input-1').fill(process.env.LOGIN || 'login');
  await page.waitForTimeout(wFT);
  //await page.locator('ion-button[type=submit].class1645091280824').click();
  //await page.waitForTimeout(wFT);
  await page.locator('#ion-input-0').fill(process.env.PASSWORD || 'password');
  await page.waitForTimeout(wFT);
  await page.locator('ion-button[type=submit].class1645091280806').click();

  // RESULTS DASHBOARD
  await expect(page.locator('ion-label.class1645887457900')).toBeAttached({ timeout: 15000 });

  // DASHBOARD: CLICK PUBLISHED APPS
  await expect(page.locator('div.class1645545973630.TabNotSelected')).toBeAttached({ timeout: 15000 });
  await page.locator('div.class1645545973630.TabNotSelected').click();
  await expect(page.locator('div.class1645545973630.TabSelected')).toBeAttached({ timeout: 15000 });

  // CLICK APP
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByText(form_name).locator('..').click()
  ]);

  await newPage.waitForLoadState('domcontentloaded');

  // GRID
  await expect(newPage.locator('div.ion-text-wrap.class1584610404188').filter({ hasText: form_name })).toBeVisible();
  await expect(newPage.getByText(grid_value).nth(0)).toBeAttached({ timeout: 15000 });
  await expect(newPage.getByText(grid_value).nth(1)).toBeAttached({ timeout: 15000 });

  // CHART
  await expect(newPage.locator('g[seriesName="t_avg_c"]')).toBeAttached({ timeout: 15000 });

  //newPage.close();
  //page.close();
});
