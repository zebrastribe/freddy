const { test, expect } = require('@playwright/test');

test.describe('Freddy Notification System', () => {
  test('Complete notification system workflow', async ({ page, context }) => {
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      }
    });
    
    // Monitor authentication requests
    page.on('request', request => {
      if (request.url().includes('verifyAdminPassword')) {
        console.log('>>> AUTH REQUEST:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('verifyAdminPassword')) {
        console.log('<<< AUTH RESPONSE:', response.status(), response.url());
      }
    });
    
    // 1. Admin login
    console.log('=== Step 1: Admin Login ===');
    await page.goto('https://zebrastribe.github.io/freddy/admin.html');
    await page.waitForLoadState('networkidle');
    
    const loginBtn = await page.locator('#login-btn');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled();
    
    await page.fill('#admin-password', 'AngryLion');
    console.log('Clicking login button...');
    await loginBtn.click();
    
    // Wait for authentication and admin section to appear
    await page.waitForSelector('#admin-section:not(.hidden)', { timeout: 15000 });
    console.log('✅ Admin login successful');
    
    // 2. Link device for notifications
    console.log('=== Step 2: Link Device for Notifications ===');
    const linkCheckbox = await page.locator('#link-this-device');
    await expect(linkCheckbox).toBeVisible();
    
    // Check the checkbox to link this device
    await linkCheckbox.check();
    await expect(linkCheckbox).toBeChecked();
    console.log('✅ Device linked for notifications');
    
    // Wait for the notification status to update
    await page.waitForTimeout(3000);
    
    // 3. Anonymous user check-in
    console.log('=== Step 3: Anonymous User Check-in ===');
    const anonymousPage = await context.newPage();
    await anonymousPage.goto('https://zebrastribe.github.io/freddy/');
    await anonymousPage.waitForLoadState('networkidle');
    
    // Fill in check-in form
    await anonymousPage.fill('#name', 'Test User - Playwright');
    await anonymousPage.click('#checkin-btn');
    
    // Wait for check-in to complete
    await anonymousPage.waitForTimeout(3000);
    console.log('✅ Anonymous check-in completed');
    
    // 4. Verify admin page shows the new check-in
    console.log('=== Step 4: Verify Check-in Appears in Admin ===');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the check-in to appear in the table
    await page.waitForSelector('text=Test User - Playwright', { timeout: 10000 });
    console.log('✅ New check-in appears in admin panel');
    
    // 5. Test notification status
    console.log('=== Step 5: Verify Notification Status ===');
    const notificationStatus = await page.locator('#notification-status');
    await expect(notificationStatus).toBeVisible();
    
    // Check that the device is still linked
    await expect(linkCheckbox).toBeChecked();
    console.log('✅ Device remains linked for notifications');
    
    console.log('🎉 Complete notification system test passed!');
  });
}); 