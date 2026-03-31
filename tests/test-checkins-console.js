// Browser console script to test check-in functionality
// Run this in the browser console on http://localhost:3000/uid123/freddy/

console.log('=== Check-in Test Script ===');

// Test 1: Check current pet info
console.log('1. Current pet info:', window.currentPetInfo);

// Test 2: Check if app is available
console.log('2. App available:', !!window.app);
console.log('3. loadAndRenderCheckIns method available:', typeof window.app?.loadAndRenderCheckIns);

// Test 3: Test loading check-ins directly
async function testLoadCheckIns() {
    if (window.app && typeof window.app.loadAndRenderCheckIns === 'function') {
        console.log('4. Calling loadAndRenderCheckIns...');
        await window.app.loadAndRenderCheckIns();
        console.log('5. loadAndRenderCheckIns completed');
    } else {
        console.log('4. ❌ loadAndRenderCheckIns method not available');
    }
}

// Test 4: Check Firebase availability
console.log('6. Firebase available:', !!window.firebaseApp);
console.log('7. Firebase DB available:', !!window.firebaseDB);

// Test 5: Check if check-ins table exists
const tableBody = document.getElementById('checkInsList');
console.log('8. Check-ins table body found:', !!tableBody);

// Test 6: Check tab elements
const recordedCheckInsTab = document.getElementById('recordedCheckInsTab');
console.log('9. Recorded check-ins tab found:', !!recordedCheckInsTab);

// Run the test
testLoadCheckIns();

// Test 7: Simulate clicking the trail tab
console.log('10. Simulating trail tab click...');
if (recordedCheckInsTab) {
    recordedCheckInsTab.click();
    console.log('11. Trail tab clicked');
}

console.log('=== Test Script Complete ==='); 