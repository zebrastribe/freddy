/**
 * Firestore Rules Test Suite
 * 
 * This script tests all Firestore security rules for different user roles
 * and collections to ensure proper access control.
 * 
 * Usage: Run this in the browser console or as a test script
 */

class FirestoreRulesTester {
  constructor() {
    this.db = null;
    this.auth = null;
    this.testResults = [];
  }

  async initialize() {
    try {
      // Use the real Firebase config from the main app
      const firebaseConfig = {
        apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
        authDomain: "tracker-6a648.firebaseapp.com",
        projectId: "tracker-6a648",
        storageBucket: "tracker-6a648.appspot.com",
        messagingSenderId: "789878332530",
        appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
        measurementId: "G-XMHHKFJ9QW"
      };

      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      this.db = firebase.firestore();
      this.auth = firebase.auth();

      console.log('✅ Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      return false;
    }
  }

  async testRead(testName, collection, docId, expectedResult) {
    try {
      const doc = await this.db.collection(collection).doc(docId).get();
      // For reads, success means the operation was allowed by rules
      // Document existence is separate from permission
      const success = true; // If we get here, the read was allowed
      const result = success === expectedResult ? 'PASS' : 'FAIL';
      console.log(`✅ ${result} ${testName} - Expected: ${expectedResult}, Actual: ${success} (Document exists: ${doc.exists})`);
      
      this.testResults.push({
        testName,
        expected: expectedResult,
        actual: success,
        success: success === expectedResult,
        documentExists: doc.exists
      });
      
      return success === expectedResult;
    } catch (error) {
      // Check if this is a permission error or just a missing document
      const isPermissionError = error.message.includes('permission') || 
                               error.message.includes('denied') || 
                               error.message.includes('Missing or insufficient permissions');
      
      const success = !isPermissionError; // Success if it's not a permission error
      const result = success === expectedResult ? 'PASS' : 'FAIL';
      console.log(`✅ ${result} ${testName} - Expected: ${expectedResult}, Actual: ${success} (Error: ${error.message})`);
      
      this.testResults.push({
        testName,
        expected: expectedResult,
        actual: success,
        success: success === expectedResult,
        error: error.message,
        isPermissionError
      });
      
      return success === expectedResult;
    }
  }

  async testWrite(testName, collection, docId, data, expectedResult) {
    try {
      console.log(`🔍 DEBUG ${testName}:`);
      console.log(`  - Collection: ${collection}`);
      console.log(`  - Document ID: ${docId}`);
      console.log(`  - Data:`, JSON.stringify(data, null, 2));
      console.log(`  - Auth state:`, this.auth.currentUser ? {
        uid: this.auth.currentUser.uid,
        isAnonymous: this.auth.currentUser.isAnonymous,
        email: this.auth.currentUser.email
      } : 'No user signed in');
      console.log(`  - Expected result: ${expectedResult}`);
      
      const docRef = this.db.collection(collection).doc(docId);
      await docRef.set(data);
      
      const success = true;
      const result = success === expectedResult ? 'PASS' : 'FAIL';
      console.log(`✅ ${result} ${testName} - Expected: ${expectedResult}, Actual: ${success}`);
      
      this.testResults.push({
        testName,
        expected: expectedResult,
        actual: success,
        error: null
      });
    } catch (error) {
      const success = false;
      const result = success === expectedResult ? 'PASS' : 'FAIL';
      
      console.log(`❌ ${result} ${testName} - Expected: ${expectedResult}, Actual: ${success}`);
      console.log(`  - Error details:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack
      });
      
      // Try to get more detailed error information
      if (error.code === 'permission-denied') {
        console.log(`  - This is a Firestore security rules error`);
        console.log(`  - The rules denied the operation`);
      }
      
      this.testResults.push({
        testName,
        expected: expectedResult,
        actual: success,
        error: error.message
      });
    }
  }

  async runSimpleTests() {
    console.log('🚀 Starting Simple Firestore Rules Test...');
    
    // Initialize Firebase
    const initialized = await this.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize Firebase');
      return;
    }

    // Test 1: Anonymous user can read public data (rules: allow read: if true)
    console.log('\n🧪 Testing anonymous user read permissions...');
    await this.testRead('Anonymous: Read check-ins (permission test)', 'clicks', 'existing_checkin', true);
    await this.testRead('Anonymous: Read pets (permission test)', 'pets', 'existing_pet', true);

    // Test 2: Anonymous user cannot create data without recaptcha token
    console.log('\n🧪 Testing anonymous user write permissions...');
    await this.testWrite('Anonymous: Create check-in (no token)', 'clicks', 'test_anonymous_no_token', {
      name: 'Anonymous User',
      latitude: 55.6761,
      longitude: 12.5683
    }, false);

    // Sign out before testing anonymous-with-token (no request.auth)
    if (this.auth.currentUser) {
      await this.auth.signOut();
      // Wait a moment for sign-out to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 3: Anonymous user can create data with recaptcha token
    console.log('\n🧪 Testing anonymous user with token...');
    const tokenData = {
      name: 'Anonymous User',
      latitude: 55.6761,
      longitude: 12.5683,
      recaptchaToken: 'test_token_456'
    };
    console.log('Token data:', tokenData);
    await this.testWrite('Anonymous: Create check-in (with token)', 'clicks', 'test_anonymous_with_token', tokenData, true);

    // Test 4: Authenticated user without user document cannot create data
    console.log('\n🧪 Testing authenticated user...');
    try {
      await this.auth.signInAnonymously();
      console.log('✅ Signed in anonymously');
      console.log('User UID:', this.auth.currentUser.uid);
      
      // Try to create check-in without user document (should fail)
      await this.testWrite('Authenticated: Create check-in (no user doc)', 'clicks', 'test_auth_no_user_doc', {
        name: 'Authenticated User',
        latitude: 55.6761,
        longitude: 12.5683
      }, false);
      
      // Create user document with USER role
      const userData = {
        uid: this.auth.currentUser.uid,
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        createdAt: new Date()
      };
      console.log('Creating user document with data:', userData);
      
      try {
        await this.db.collection('users').doc(this.auth.currentUser.uid).set(userData);
        console.log('✅ User document created');
        
        // Verify the user document was created correctly
        const userDoc = await this.db.collection('users').doc(this.auth.currentUser.uid).get();
        console.log('User document exists:', userDoc.exists);
        if (userDoc.exists) {
          console.log('User document data:', userDoc.data());
        }
      } catch (userError) {
        console.error('❌ Error creating user document:', userError);
        throw userError;
      }
      
      // Wait for Firestore to index the new user document
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test that we can read the user document (this should work)
      console.log('Testing user document read access...');
      try {
        const userDocRead = await this.db.collection('users').doc(this.auth.currentUser.uid).get();
        console.log('✅ User document read successful:', userDocRead.exists);
      } catch (readError) {
        console.error('❌ User document read failed:', readError);
      }
      
      // Try to create check-in with user document (should succeed)
      await this.testWrite('Authenticated: Create check-in (with user doc)', 'clicks', 'test_auth_with_user_doc', {
        name: 'Authenticated User',
        latitude: 55.6761,
        longitude: 12.5683
      }, true);
      
    } catch (error) {
      console.error('❌ Failed to test authenticated user:', error);
      await this.testWrite('Authenticated: Create check-in (failed)', 'clicks', 'test_auth_failed', {
        name: 'Authenticated User',
        latitude: 55.6761,
        longitude: 12.5683
      }, false);
    }

    // Generate results
    this.generateResults();
  }

  generateResults() {
    console.log('\n📊 Test Results:');
    console.log('================');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    for (const result of this.testResults) {
      totalTests++;
      if (result.success) {
        passedTests++;
      } else {
        failedTests++;
      }
    }
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      for (const result of this.testResults) {
        if (!result.success) {
          console.log(`  - ${result.testName}: Expected ${result.expected}, got ${result.actual}`);
          if (result.error) {
            console.log(`    Error: ${result.error}`);
          }
        }
      }
    }
  }
}

// Make it available globally
window.FirestoreRulesTester = FirestoreRulesTester; 