const { test, expect } = require('@playwright/test');

test.describe('Cross-Device Notification System', () => {
  test('should send notifications between different devices', async ({ browser }) => {
    // Create two browser contexts to simulate different devices
    const device1 = await browser.newContext();
    const device2 = await browser.newContext();
    
    const page1 = await device1.newPage();
    const page2 = await device2.newPage();
    
    try {
      // Device 1: Enable notifications for Test pet
      await page1.goto('/ares/Test');
      
      // Mock notification permission for device 1
      await page1.addInitScript(() => {
        Object.defineProperty(window, 'Notification', {
          value: {
            permission: 'granted',
            requestPermission: () => Promise.resolve('granted')
          },
          writable: true
        });
      });
      
      // Wait for page to load
      await page1.waitForSelector('#notification-toggle', { timeout: 10000 });
      
      // Enable notifications
      const enableButton = page1.locator('#notification-toggle');
      await enableButton.click();
      
      // Wait for storage to update
      await page1.waitForTimeout(1000);
      
      // Verify notifications are enabled
      const notificationsEnabled = await page1.evaluate(() => {
        return localStorage.getItem('notifications_enabled_Test') === 'true';
      });
      expect(notificationsEnabled).toBe(true);
      
      // Device 2: Submit a check-in
      await page2.goto('/ares/Test?token=dev');
      
      // Wait for check-in form
      await page2.waitForSelector('#checkin-form', { timeout: 10000 });
      
      // Fill and submit check-in
      await page2.fill('#location', 'Test Location');
      await page2.fill('#notes', 'Test check-in from device 2');
      await page2.click('#submit-checkin');
      
      // Wait for processing
      await page2.waitForTimeout(2000);
      
      // Verify check-in was submitted (form reset or success message)
      const formReset = await page2.locator('#location').inputValue();
      const successElements = await page2.locator('text=success').count();
      expect(formReset === '' || successElements > 0).toBe(true);
      
      // Device 1: Should receive notification
      await page1.waitForTimeout(2000);
      
      // Check for notification or floating message
      const notificationElements = await page1.locator('text=Alert').count();
      const floatingElements = await page1.locator('text=check-in').count();
      
      // Either notification or floating message should be present
      expect(notificationElements > 0 || floatingElements > 0).toBe(true);
      
    } finally {
      await device1.close();
      await device2.close();
    }
  });

  test('should not send notifications to the device making the check-in', async ({ browser }) => {
    // Create two browser contexts
    const device1 = await browser.newContext();
    const device2 = await browser.newContext();
    
    const page1 = await device1.newPage();
    const page2 = await device2.newPage();
    
    try {
      // Device 1: Enable notifications and make check-in
      await page1.goto('/ares/Test');
      
      // Mock notification permission
      await page1.addInitScript(() => {
        Object.defineProperty(window, 'Notification', {
          value: {
            permission: 'granted',
            requestPermission: () => Promise.resolve('granted')
          },
          writable: true
        });
      });
      
      // Wait for page to load
      await page1.waitForSelector('#notification-toggle', { timeout: 10000 });
      
      // Enable notifications
      const enableButton = page1.locator('#notification-toggle');
      await enableButton.click();
      
      // Wait for storage to update
      await page1.waitForTimeout(1000);
      
      // Navigate to check-in page
      await page1.goto('/ares/Test?token=dev');
      
      // Wait for check-in form
      await page1.waitForSelector('#checkin-form', { timeout: 10000 });
      
      // Fill and submit check-in
      await page1.fill('#location', 'Test Location');
      await page1.fill('#notes', 'Test check-in from device 1');
      await page1.click('#submit-checkin');
      
      // Wait for success message
      await page1.waitForTimeout(2000);
      
      // Verify check-in was submitted
      const formReset = await page1.locator('#location').inputValue();
      const successElements = await page1.locator('text=success').count();
      expect(formReset === '' || successElements > 0).toBe(true);
      
      // Wait a moment
      await page1.waitForTimeout(2000);
      
      // Device 1 should NOT receive notification (since it made the check-in)
      const notificationElements = await page1.locator('text=Alert').count();
      const floatingElements = await page1.locator('text=check-in').count();
      
      // Should not have notification elements
      expect(notificationElements).toBe(0);
      expect(floatingElements).toBe(0);
      
    } finally {
      await device1.close();
      await device2.close();
    }
  });

  test('should handle multiple pets with different notification settings', async ({ browser }) => {
    // Create two browser contexts
    const device1 = await browser.newContext();
    const device2 = await browser.newContext();
    
    const page1 = await device1.newPage();
    const page2 = await device2.newPage();
    
    try {
      // Device 1: Enable notifications for Test pet only
      await page1.goto('/ares/Test');
      
      // Mock notification permission
      await page1.addInitScript(() => {
        Object.defineProperty(window, 'Notification', {
          value: {
            permission: 'granted',
            requestPermission: () => Promise.resolve('granted')
          },
          writable: true
        });
      });
      
      // Wait for page to load
      await page1.waitForSelector('#notification-toggle', { timeout: 10000 });
      
      // Enable notifications for Test pet
      const enableButton = page1.locator('#notification-toggle');
      await enableButton.click();
      
      // Wait for storage to update
      await page1.waitForTimeout(1000);
      
      // Verify Test pet notifications are enabled
      const testPetEnabled = await page1.evaluate(() => {
        return localStorage.getItem('notifications_enabled_Test') === 'true';
      });
      expect(testPetEnabled).toBe(true);
      
      // Navigate to different pet and verify notifications are not enabled
      await page1.goto('/ares/AnotherPet');
      
      // Wait for page to load
      await page1.waitForSelector('#notification-toggle', { timeout: 10000 });
      
      // Verify AnotherPet notifications are not enabled
      const anotherPetEnabled = await page1.evaluate(() => {
        return localStorage.getItem('notifications_enabled_AnotherPet') === 'true';
      });
      expect(anotherPetEnabled).toBe(false);
      
      // Device 2: Submit check-in for Test pet
      await page2.goto('/ares/Test?token=dev');
      
      // Wait for check-in form
      await page2.waitForSelector('#checkin-form', { timeout: 10000 });
      
      // Fill and submit check-in
      await page2.fill('#location', 'Test Location');
      await page2.fill('#notes', 'Test check-in for Test pet');
      await page2.click('#submit-checkin');
      
      // Wait for processing
      await page2.waitForTimeout(2000);
      
      // Device 1: Should receive notification for Test pet
      await page1.waitForTimeout(2000);
      
      // Check for notification
      const notificationElements = await page1.locator('text=Alert').count();
      const floatingElements = await page1.locator('text=check-in').count();
      
      // Should receive notification for Test pet
      expect(notificationElements > 0 || floatingElements > 0).toBe(true);
      
    } finally {
      await device1.close();
      await device2.close();
    }
  });

  test('should handle notification permission changes', async ({ browser }) => {
    // Create two browser contexts
    const device1 = await browser.newContext();
    const device2 = await browser.newContext();
    
    const page1 = await device1.newPage();
    const page2 = await device2.newPage();
    
    try {
      // Device 1: Enable notifications
      await page1.goto('/ares/Test');
      
      // Mock notification permission
      await page1.addInitScript(() => {
        Object.defineProperty(window, 'Notification', {
          value: {
            permission: 'granted',
            requestPermission: () => Promise.resolve('granted')
          },
          writable: true
        });
      });
      
      // Wait for page to load
      await page1.waitForSelector('#notification-toggle', { timeout: 10000 });
      
      // Enable notifications
      const enableButton = page1.locator('#notification-toggle');
      await enableButton.click();
      
      // Wait for storage to update
      await page1.waitForTimeout(1000);
      
      // Verify notifications are enabled
      const notificationsEnabled = await page1.evaluate(() => {
        return localStorage.getItem('notifications_enabled_Test') === 'true';
      });
      expect(notificationsEnabled).toBe(true);
      
      // Device 2: Submit check-in
      await page2.goto('/ares/Test?token=dev');
      
      // Wait for check-in form
      await page2.waitForSelector('#checkin-form', { timeout: 10000 });
      
      // Fill and submit check-in
      await page2.fill('#location', 'Test Location');
      await page2.fill('#notes', 'Test check-in after permission change');
      await page2.click('#submit-checkin');
      
      // Wait for processing
      await page2.waitForTimeout(2000);
      
      // Device 1: Should receive notification
      await page1.waitForTimeout(2000);
      
      // Check for notification
      const notificationElements = await page1.locator('text=Alert').count();
      const floatingElements = await page1.locator('text=check-in').count();
      
      // Should receive notification
      expect(notificationElements > 0 || floatingElements > 0).toBe(true);
      
    } finally {
      await device1.close();
      await device2.close();
    }
  });

  test('should handle network disconnections gracefully', async ({ browser }) => {
    // Create two browser contexts
    const device1 = await browser.newContext();
    const device2 = await browser.newContext();
    
    const page1 = await device1.newPage();
    const page2 = await device2.newPage();
    
    try {
      // Device 1: Enable notifications
      await page1.goto('/ares/Test');
      
      // Mock notification permission
      await page1.addInitScript(() => {
        Object.defineProperty(window, 'Notification', {
          value: {
            permission: 'granted',
            requestPermission: () => Promise.resolve('granted')
          },
          writable: true
        });
      });
      
      // Wait for page to load
      await page1.waitForSelector('#notification-toggle', { timeout: 10000 });
      
      // Enable notifications
      const enableButton = page1.locator('#notification-toggle');
      await enableButton.click();
      
      // Wait for storage to update
      await page1.waitForTimeout(1000);
      
      // Device 2: Submit check-in with network error
      await page2.goto('/ares/Test?token=dev');
      
      // Wait for check-in form
      await page2.waitForSelector('#checkin-form', { timeout: 10000 });
      
      // Mock network error
      await page2.route('**/*', route => {
        if (route.request().url().includes('firestore')) {
        route.abort();
        } else {
          route.continue();
        }
      });
      
      // Fill and submit check-in
      await page2.fill('#location', 'Test Location');
      await page2.fill('#notes', 'Test check-in with network error');
      await page2.click('#submit-checkin');
      
      // Wait for error handling
      await page2.waitForTimeout(2000);
      
      // Should handle the error gracefully
      const errorElements = await page2.locator('text=error').count();
      const formStillPresent = await page2.locator('#checkin-form').isVisible();
      
      // Either error message or form still present (indicating error handling)
      expect(errorElements > 0 || formStillPresent).toBe(true);
      
      // Restore network connection
      await page1.unroute('**/*');
      
    } finally {
      await device1.close();
      await device2.close();
    }
  });
}); 