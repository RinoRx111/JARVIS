import { test, expect } from '@playwright/test';

test.describe('App Initialization', () => {
  test('should load the home page', async ({ page }) => {
    // Navigate to the base URL
    await page.goto('/');

    // Expect the page to have a title or specific element
    // Since Next.js loads the AuthOverlay, we can check for text that represents the initialization or login
    await expect(page.locator('body')).toBeVisible();

    // Check if the page contains some key text confirming it loaded
    // It could be the AuthOverlay or the main dashboard (CHAT HISTORY)
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/SYSTEM INITIALIZATION|SECURE LOGIN|CHAT HISTORY/);
  });
});
