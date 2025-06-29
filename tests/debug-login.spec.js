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
  
  // Monitor JavaScript errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  // Go to admin page
  await page.goto('https://zebrastribe.github.io/freddy/admin.html');
  await page.waitForLoadState('networkidle');
  
  // Wait for DOM to be ready
  await page.waitForSelector('#login-btn', { timeout: 10000 });
  
  // Check if login button exists
  const loginBtn = await page.locator('#login-btn');
  await expect(loginBtn).toBeVisible();
  
  // Check button type
  const buttonType = await loginBtn.getAttribute('type');
  console.log('Button type:', buttonType);
  
  // Check if the button has an onclick handler
  const hasOnClick = await loginBtn.evaluate(el => {
    return el.onclick !== null || el.getAttribute('onclick') !== null;
  });
  console.log('Button has onclick handler:', hasOnClick);
  
  // Check if the form has onsubmit handler
  const form = await page.locator('#login-form');
  const formOnSubmit = await form.getAttribute('onsubmit');
  console.log('Form onsubmit:', formOnSubmit);
  
  // Fill password
  await page.fill('#admin-password', 'AngryLion');
  
  // Click button and wait
  console.log('About to click login button...');
  await loginBtn.click();
  console.log('Login button clicked');
  
  // Wait for any network requests
  await page.waitForTimeout(3000);
  
  // Check if any requests were made to the Cloud Function
  const requests = await page.evaluate(() => {
    return window.performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('cloudfunctions.net'))
      .map(entry => ({ url: entry.name, type: entry.initiatorType }));
  });
  console.log('Cloud Function requests:', requests);
  
  // Check error message
  const errorElement = await page.locator('#login-error');
  const errorText = await errorElement.textContent();
  console.log('Error text:', errorText);
  
  // Check if admin section is visible
  const adminSection = await page.locator('#admin-section');
  const isHidden = await adminSection.evaluate(el => el.classList.contains('hidden'));
  console.log('Admin section hidden:', isHidden);
  
  // Check if login section is still visible
  const loginSection = await page.locator('#login-section');
  const loginHidden = await loginSection.evaluate(el => el.classList.contains('hidden'));
  console.log('Login section hidden:', loginHidden);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-login.png' });
  console.log('Screenshot saved as debug-login.png');
  
  // Additional debugging: check if JavaScript is executing
  const jsWorking = await page.evaluate(() => {
    return {
      documentReady: document.readyState,
      hasLoginBtn: !!document.getElementById('login-btn'),
      hasPasswordField: !!document.getElementById('admin-password'),
      hasForm: !!document.getElementById('login-form')
    };
  });
  console.log('JavaScript execution check:', jsWorking);
}); 