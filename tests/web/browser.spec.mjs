import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const smokeScript = readFileSync(new URL('./browser_smoke.js', import.meta.url), 'utf8');

test('core lessons load and pass through the actual app', async ({ page, baseURL }) => {
  const errors = [];
  const origin = new URL(baseURL).origin;
  const isSiteAsset = request => request.url().startsWith(`${origin}/`)
    && ['document', 'script', 'stylesheet'].includes(request.resourceType());
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => {
    if (isSiteAsset(request)) errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  page.on('response', response => {
    if (isSiteAsset(response.request()) && response.status() >= 400)
      errors.push(`${response.url()}: HTTP ${response.status()}`);
  });
  // Fonts are decorative and must not make acceptance depend on an external service.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript(() => localStorage.setItem('git_lab_hide_intro_modal', 'true'));
  await page.goto(baseURL);
  await expect(page.locator('#terminal-input')).toBeVisible();

  const result = JSON.parse(await page.evaluate(smokeScript));
  expect(result.passed).toEqual(['36', '37', '12', '11', '09', '17', '38', '39', '41', '44']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // Exercise the keyboard event wiring, which direct simulator calls do not cover.
  await page.locator('#terminal-input').fill('git status -s');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.locator('#terminal-input')).toHaveValue('');
  await expect(page.locator('#terminal-output')).toContainText('report.txt');
  expect(errors).toEqual([]);
});
