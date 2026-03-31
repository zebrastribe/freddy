const { test, expect } = require('@playwright/test');

test('debug route parameters and localStorage keys', async ({ page }) => {
  // Mock Notification before navigation
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: () => Promise.resolve('granted')
      },
      writable: true
    });
  });

  // Navigate to first pet
  await page.goto('/ares/Test?token=dev');
  await page.waitForSelector('#notification-toggle', { timeout: 10000 });
  
  // Check what route parameters are extracted
  const routeParams = await page.evaluate(() => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(part => part);
    console.log('Route path:', path, 'parts:', parts);
    if (parts.length >= 2) {
      return { userid: parts[0], name: parts[1] };
    }
    return null;
  });
  
  console.log('Route params:', routeParams);
  
  // Click notification toggle
  await page.locator('#notification-toggle').click();
  await page.waitForTimeout(1000);
  
  // Check all localStorage keys
  const allKeys = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const notificationKeys = keys.filter(key => key.includes('notification'));
    return { allKeys: keys, notificationKeys: notificationKeys };
  });
  
  console.log('All localStorage keys:', allKeys.allKeys);
  console.log('Notification keys:', allKeys.notificationKeys);
  
  // Check specific keys
  const testKey = await page.evaluate(() => localStorage.getItem('notifications_enabled_Test'));
  const test2Key = await page.evaluate(() => localStorage.getItem('notifications_enabled_test2'));
  
  console.log('notifications_enabled_Test:', testKey);
  console.log('notifications_enabled_test2:', test2Key);
  
  // Check if any notification keys exist
  if (allKeys.notificationKeys.length > 0) {
    console.log('Found notification keys:', allKeys.notificationKeys);
    for (const key of allKeys.notificationKeys) {
      const value = await page.evaluate((k) => localStorage.getItem(k), key);
      console.log(`Key "${key}":`, value);
    }
  }
});

test('debug second pet page', async ({ page }) => {
  // Mock Notification before navigation
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: () => Promise.resolve('granted')
      },
      writable: true
    });
  });

  // Navigate to second pet
  await page.goto('/ares/test2?token=dev');
  
  // Wait for page to load
  await page.waitForSelector('#app', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Check if notification toggle exists
  const toggleExists = await page.locator('#notification-toggle').count();
  console.log('Notification toggle count:', toggleExists);
  
  if (toggleExists > 0) {
    console.log('✅ Notification toggle found on second pet page');
    
    // Check route parameters
    const routeParams = await page.evaluate(() => {
      const path = window.location.pathname;
      const parts = path.split('/').filter(part => part);
      console.log('Route path:', path, 'parts:', parts);
      if (parts.length >= 2) {
        return { userid: parts[0], name: parts[1] };
      }
      return null;
    });
    
    console.log('Route params for second pet:', routeParams);
    
    // Click the toggle
    await page.locator('#notification-toggle').click();
    await page.waitForTimeout(1000);
    
    // Check localStorage
    const allKeys = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const notificationKeys = keys.filter(key => key.includes('notification'));
      return { allKeys: keys, notificationKeys: notificationKeys };
    });
    
    console.log('All localStorage keys after second pet toggle:', allKeys.allKeys);
    console.log('Notification keys after second pet toggle:', allKeys.notificationKeys);
  } else {
    console.log('❌ Notification toggle NOT found on second pet page');
    
    // Check what elements are on the page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.textContent.substring(0, 500),
        appContent: document.getElementById('app')?.innerHTML?.substring(0, 500)
      };
    });
    
    console.log('Page title:', pageContent.title);
    console.log('Page body text (first 500 chars):', pageContent.bodyText);
    console.log('App content (first 500 chars):', pageContent.appContent);
  }
});

test('notification permission and storage is per-pet, not global', async ({ page }) => {
  // Always mock Notification before navigation
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: () => Promise.resolve('granted')
      },
      writable: true
    });
  });

  // 0. Go to first pet page, clear localStorage, reload
  await page.goto('/ares/Test?token=dev');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#notification-toggle', { timeout: 10000 });
  await page.waitForTimeout(1000); // Wait for JS to fully initialize

  // Check Notification mock is in effect
  const notifPerm = await page.evaluate(() => Notification.permission);
  console.log('Notification.permission at start:', notifPerm);

  await page.locator('#notification-toggle').click();
  await page.waitForTimeout(1000);

  // Log all localStorage keys after first toggle
  const allKeys1 = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const notificationKeys = keys.filter(key => key.includes('notification'));
    return { allKeys: keys, notificationKeys: notificationKeys };
  });
  console.log('After first toggle - All keys:', allKeys1.allKeys);
  console.log('After first toggle - Notification keys:', allKeys1.notificationKeys);

  // 2. Verify only notifications_enabled_Test is set
  let testEnabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_Test'));
  let test2Enabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_test2'));
  console.log('Test enabled:', testEnabled);
  console.log('Test2 enabled:', test2Enabled);
  expect(testEnabled).toBe('true');
  expect(test2Enabled).toBe(null);

  // 3. Switch to Pet B (/ares/test2?token=dev)
  await page.goto('/ares/test2?token=dev');
  await page.waitForSelector('#notification-toggle', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // 4. Verify notifications_enabled_test2 is not set
  test2Enabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_test2'));
  testEnabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_Test'));
  console.log('Before second toggle - Test enabled:', testEnabled);
  console.log('Before second toggle - Test2 enabled:', test2Enabled);
  expect(test2Enabled).toBe(null);
  expect(testEnabled).toBe('true'); // Should still be set from previous pet

  // 5. Enable notifications for Pet B
  await page.locator('#notification-toggle').click();
  await page.waitForTimeout(1000);

  // Log all localStorage keys after second toggle
  const allKeys2 = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const notificationKeys = keys.filter(key => key.includes('notification'));
    return { allKeys: keys, notificationKeys: notificationKeys };
  });
  console.log('After second toggle - All keys:', allKeys2.allKeys);
  console.log('After second toggle - Notification keys:', allKeys2.notificationKeys);

  // 6. Verify both keys are set independently
  test2Enabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_test2'));
  testEnabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_Test'));
  console.log('After second toggle - Test enabled:', testEnabled);
  console.log('After second toggle - Test2 enabled:', test2Enabled);
  expect(test2Enabled).toBe('true');
  expect(testEnabled).toBe('true');

  // 7. Disable notifications for Pet A
  await page.goto('/ares/Test?token=dev');
  await page.waitForSelector('#notification-toggle', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.locator('#notification-toggle').click();
  await page.waitForTimeout(1000);

  // Log all localStorage keys after third toggle
  const allKeys3 = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const notificationKeys = keys.filter(key => key.includes('notification'));
    return { allKeys: keys, notificationKeys: notificationKeys };
  });
  console.log('After third toggle - All keys:', allKeys3.allKeys);
  console.log('After third toggle - Notification keys:', allKeys3.notificationKeys);

  // 8. Verify only Pet B's key remains
  testEnabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_Test'));
  test2Enabled = await page.evaluate(() => localStorage.getItem('notifications_enabled_test2'));
  console.log('Final - Test enabled:', testEnabled);
  console.log('Final - Test2 enabled:', test2Enabled);
  expect(testEnabled).toBe(null);
  expect(test2Enabled).toBe('true'); // Should still be enabled

  console.log('✅ Per-pet notification storage verified successfully!');
}); 