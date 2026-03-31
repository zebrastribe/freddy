console.log('📦 main.js loaded');

try {
  console.log('📦 Attempting to import firebase...');
    import('./shared/firebase.js').then(() => {
    console.log('✅ Firebase imported successfully');
    console.log('✅ Main.js initialization complete');
    }).catch(error => {
    console.error('❌ Firebase import failed:', error)
    })
    
} catch (error) {
  console.error('❌ Main.js execution error:', error)
} 