import { test, expect } from '@playwright/test';

test('App loads and shows main navigation', async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000');
  await expect(page).toHaveTitle(/sandbox/i);
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('heading')).toBeVisible();
});