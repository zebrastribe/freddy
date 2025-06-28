// Configuration file for API keys and settings
// This file should be updated with your actual API keys

export const config = {
  // Google Maps API Configuration
  googleMaps: {
    apiKey: 'AIzaSyBd3xQgm7vnL2LCmxpabVT5qAhSFOteuGY',
    mapId: '8bac4e61a05fc3c2',
    defaultCenter: { lat: 55.6606758, lng: 12.5226001 },
    defaultZoom: 15
  },
  
  // reCAPTCHA Configuration
  recaptcha: {
    siteKey: '6LdA7jIqAAAAAKYtion4hiHa7R--TT3maGb0EpNZ'
  },
  
  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
    authDomain: "tracker-6a648.firebaseapp.com",
    projectId: "tracker-6a648",
    storageBucket: "tracker-6a648.appspot.com",
    messagingSenderId: "789878332530",
    appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
    measurementId: "G-XMHHKFJ9QW"
  },
  
  // App Configuration
  app: {
    name: 'Freddy',
    version: '1.0.0',
    entriesPerPage: 10,
    checkInCooldown: 15000 // 15 seconds
  }
};

// Environment-specific configurations
export const getConfig = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development environment
    return {
      ...config,
      environment: 'development'
    };
  } else if (hostname.includes('github.io')) {
    // GitHub Pages environment
    return {
      ...config,
      environment: 'production',
      // Add any production-specific overrides here
    };
  } else {
    // Production environment
    return {
      ...config,
      environment: 'production'
    };
  }
}; 