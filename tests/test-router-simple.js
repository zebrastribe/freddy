// Simple test to verify router Firebase access
console.log('🧪 Testing router Firebase access...');

// Check if window.app is available
if (window.app) {
  console.log('✅ window.app is available');
  if (window.app.db) {
    console.log('✅ window.app.db is available');
  } else {
    console.log('❌ window.app.db is not available');
  }
} else {
  console.log('❌ window.app is not available');
}

// Check if window.firebaseApp is available
if (window.firebaseApp) {
  console.log('✅ window.firebaseApp is available');
} else {
  console.log('❌ window.firebaseApp is not available');
}

// Check if window.firebaseDB is available
if (window.firebaseDB) {
  console.log('✅ window.firebaseDB is not available');
} else {
  console.log('❌ window.firebaseDB is not available');
}
