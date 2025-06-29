#!/usr/bin/env node

/**
 * Firebase Security Setup Script
 * 
 * This script sets up Firebase Remote Config with:
 * - Admin password (stored securely)
 * - API keys (for client-side use)
 * 
 * Usage: node setup-firebase-security.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account)
// Download your service account key from Firebase Console
// and set the path below
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const remoteConfig = admin.remoteConfig();

async function setupRemoteConfig() {
  try {
    console.log('Setting up Firebase Remote Config...');

    // Get current template
    const template = await remoteConfig.getTemplate();

    // Define parameters
    const parameters = {
      admin_password: {
        defaultValue: {
          value: 'YourNewSecurePassword123!' // Change this to a secure password
        },
        description: 'Admin password for Freddy app',
        valueType: 'STRING'
      },
      google_maps_api_key: {
        defaultValue: {
          value: 'AIzaSyBd3xQgm7vnL2LCmxpabVT5qAhSFOteuGY'
        },
        description: 'Google Maps API key',
        valueType: 'STRING'
      },
      firebase_api_key: {
        defaultValue: {
          value: 'AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss'
        },
        description: 'Firebase API key',
        valueType: 'STRING'
      },
      recaptcha_site_key: {
        defaultValue: {
          value: '6LdA7jIqAAAAAKYtion4hiHa7R--TT3maGb0EpNZ'
        },
        description: 'reCAPTCHA site key',
        valueType: 'STRING'
      }
    };

    // Update template with new parameters
    template.parameters = {
      ...template.parameters,
      ...parameters
    };

    // Publish the template
    await remoteConfig.publishTemplate(template);

    console.log('✅ Firebase Remote Config setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy the updated Cloud Functions: firebase deploy --only functions');
    console.log('2. Update your admin password in the Firebase Console');
    console.log('3. Test the new authentication system');
    console.log('\n🔐 Security improvements:');
    console.log('- Admin password is now stored securely in Firebase');
    console.log('- API keys are fetched from Firebase instead of being hardcoded');
    console.log('- Session management with expiration');

  } catch (error) {
    console.error('❌ Error setting up Remote Config:', error);
    process.exit(1);
  }
}

// Run the setup
setupRemoteConfig(); 