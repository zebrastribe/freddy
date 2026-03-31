const { test, expect } = require('@playwright/test');

test('should load the main page', async ({ page }) => {
  // Navigate to the main app
  const response = await page.goto('/');
  expect(response && response.ok()).toBeTruthy();
  
  // Wait for app root to exist in DOM (visibility can vary by CSS/theme state)
  await page.waitForSelector('#app', { timeout: 10000, state: 'attached' });
  
  const appElement = page.locator('#app');
  await expect(appElement).toHaveCount(1);
});

test('should load object page with token', async ({ page }) => {
  // Navigate to object page with token
  const response = await page.goto('/ares/Test?token=dev');
  expect(response && response.ok()).toBeTruthy();
  
  // Wait for shell/root to exist
  await page.waitForSelector('#app', { timeout: 10000, state: 'attached' });
  
  // Basic route sanity check for tokenized deep-link
  await expect(page).toHaveURL(/\/ares\/Test\?token=dev/);

});

test('should load admin route and render admin shell', async ({ page }) => {
  // Navigate to admin route
  const response = await page.goto('/admin');
  expect(response && response.ok()).toBeTruthy();
  
  // Ensure admin shell is rendered (v2 admin no longer relies on #app root).
  await page.waitForFunction(() => {
    const bodyText = (document.body && document.body.innerText || '').trim();
    return bodyText.length > 0;
  }, { timeout: 15000 });

  const bodyText = await page.locator('body').innerText();
  const hasAdminShell = bodyText.includes('Admin Panel');
  const hasEmulatorGate = bodyText.includes('Running in emulator mode');
  const hasMinimalAdminShell = bodyText.includes('Admin') && bodyText.includes('Overview');
  expect(hasAdminShell || hasEmulatorGate || hasMinimalAdminShell).toBeTruthy();
}); 