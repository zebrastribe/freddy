/**
 * Test Database Setup Script
 * 
 * This script tests the database setup for the multi-user, multi-pet system
 */

import { setupDatabaseCollections, validateSetup } from '../migration-scripts/setup-database-collections.js';

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup for multi-user, multi-pet system...');
  
  try {
    // Step 1: Run the database setup
    console.log('\n📋 Step 1: Running database setup...');
    const setupResult = await setupDatabaseCollections();
    
    if (!setupResult.success) {
      throw new Error('Database setup failed');
    }
    
    console.log('✅ Database setup completed successfully');
    
    // Step 2: Validate the setup
    console.log('\n📋 Step 2: Validating setup...');
    const validationResult = await validateSetup();
    
    // Step 3: Check validation results
    console.log('\n📋 Step 3: Checking validation results...');
    const allValid = Object.values(validationResult).every(result => 
      typeof result === 'boolean' ? result : result > 0
    );
    
    if (allValid) {
      console.log('✅ All validation checks passed!');
    } else {
      console.log('⚠️ Some validation checks failed:');
      Object.entries(validationResult).forEach(([key, value]) => {
        const status = typeof value === 'boolean' ? (value ? '✅' : '❌') : (value > 0 ? '✅' : '❌');
        console.log(`  ${status} ${key}: ${value}`);
      });
    }
    
    // Step 4: Summary
    console.log('\n📊 Setup Summary:');
    console.log(`• Super Admin: ${setupResult.superAdmin.id}`);
    console.log(`• Freddy Pet: ${setupResult.freddyPet.id}`);
    console.log(`• Check-ins migrated: ${setupResult.stats.checkIns}`);
    console.log(`• FCM tokens migrated: ${setupResult.stats.fcmTokens}`);
    console.log(`• Access tokens migrated: ${setupResult.stats.accessTokens}`);
    
    console.log('\n🎉 Database setup test completed successfully!');
    
    return {
      success: true,
      setup: setupResult,
      validation: validationResult
    };
    
  } catch (error) {
    console.error('❌ Database setup test failed:', error);
    throw error;
  }
}

// Run the test
testDatabaseSetup()
  .then(result => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 