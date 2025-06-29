const { test, expect } = require('@playwright/test');

test('Debug admin login', async ({ page }) => {
  // Monitor all console messages
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  
  // Monitor all network requests
  page.on('request', request => {
    console.log('REQUEST:', request.method(), request.url());
  });
  
  page.on('response', response => {
    console.log('RESPONSE:', response.status(), response.url());
  });
  
  // Go to admin page
  await page.goto('https://zebrastribe.github.io/freddy/admin.html');
  await page.waitForLoadState('networkidle');
  
  // Check if login button exists
  const loginBtn = await page.locator('#login-btn');
  await expect(loginBtn).toBeVisible();
  
  // Check button type
  const buttonType = await loginBtn.getAttribute('type');
  console.log('Button type:', buttonType);
  
  // Fill password
  await page.fill('#admin-password', 'AngryLion');
  
  // Click button and wait
  console.log('About to click login button...');
  await loginBtn.click();
  console.log('Login button clicked');
  
  // Wait and check what happened
  await page.waitForTimeout(5000);
  
  // Check error message
  const errorElement = await page.locator('#login-error');
  const errorText = await errorElement.textContent();
  console.log('Error text:', errorText);
  
  // Check if admin section is visible
  const adminSection = await page.locator('#admin-section');
  const isHidden = await adminSection.evaluate(el => el.classList.contains('hidden'));
  console.log('Admin section hidden:', isHidden);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-login.png' });
  console.log('Screenshot saved as debug-login.png');
}); 