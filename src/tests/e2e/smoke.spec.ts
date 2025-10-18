import { test, expect } from '@playwright/test';

test('shows welcome copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RATW Tracker' })).toBeVisible();
  await expect(page.getByText('Next steps')).toBeVisible();
});
