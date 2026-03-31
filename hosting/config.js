/**
 * Hosting Configuration
 * 
 * @description Configuration for all hosting providers in the multi-user, multi-pet system
 */

export const hostingConfig = {
  // Current hosting provider
  currentProvider: 'github_pages',
  
  // Provider configurations
  providers: {
    github_pages: {
      baseUrl: 'https://zebrastribe.github.io/trace',
      repoOwner: 'zebrastribe',
      repoName: 'trace',
      deploymentMethod: 'git_push',
      configFile: '_config.yml',
      branch: 'main',
      token: process.env.GITHUB_TOKEN || null,
      autoDeploy: true,
      jekyll: {
        enabled: true,
        theme: 'jekyll-theme-cayman',
        plugins: ['jekyll-feed']
      },
      repository: {
        owner: 'zebrastribe',
        name: 'trace',
        branch: 'main'
      }
    },
    
    firebase_hosting: {
      baseUrl: 'https://trace-pets.web.app',
      projectId: 'tracker-6a648',
      deploymentMethod: 'firebase_deploy',
      configFile: 'firebase.json',
      region: 'us-central1',
      autoDeploy: true,
      functions: {
        enabled: true,
        source: 'functions'
      },
      firestore: {
        rules: 'firestore.rules',
        indexes: 'firestore.indexes.json'
      }
    },
    
    custom: {
      baseUrl: 'https://trace.stri.be',
      deploymentMethod: 'custom',
      configFile: 'deployment.json',
      ssh: {
        host: process.env.CUSTOM_HOST || null,
        user: process.env.CUSTOM_USER || null,
        port: process.env.CUSTOM_PORT || 22,
        keyPath: process.env.CUSTOM_KEY_PATH || null,
        serverType: 'nginx', // nginx, apache, or other
        webRoot: '/var/www',
        backupPath: '/var/www/backups'
      },
      ftp: {
        host: process.env.FTP_HOST || null,
        user: process.env.FTP_USER || null,
        password: process.env.FTP_PASSWORD || null,
        port: process.env.FTP_PORT || 21,
        secure: process.env.FTP_SECURE === 'true',
        webRoot: '/public_html'
      }
    }
  },
  
  // Simply.com DNS API configuration
  simply: {
    accountNo: process.env.SIMPLY_ACCOUNT_NO || 'Sxxxxxx', // Your Simply.com account number (format: Sxxxxxx)
    apiKey: process.env.SIMPLY_API_KEY || 'your-api-key-here', // Your Simply.com API key
    domain: 'stri.be',
    apiUrl: 'https://api.simply.com/2',
    defaultTTL: 300,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  },
  
  // Global settings
  global: {
    // Pet path template
    petPathTemplate: '/{petname}/',
    
    // Admin path
    adminPath: '/admin/',
    
    // Default pet configuration
    defaultPetConfig: {
      type: 'cat',
      status: 'active',
      isPublic: true,
      metadata: {
        description: 'A beloved pet being tracked with love',
        personality: 'friendly',
        color: 'unknown'
      }
    },
    
    // Deployment settings
    deployment: {
      autoBackup: true,
      backupRetention: 7, // days
      rollbackEnabled: true,
      healthCheck: true,
      monitoring: {
        enabled: true,
        interval: 300000, // 5 minutes
        timeout: 10000 // 10 seconds
      }
    },
    
    // DNS settings
    dns: {
      provider: 'simply',
      domain: 'stri.be',
      ttl: 300,
      autoCreate: true,
      autoDelete: true
    },
    
    // Security settings
    security: {
      https: true,
      hsts: true,
      csp: true,
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // requests per window
      }
    },
    
    // Performance settings
    performance: {
      caching: {
        enabled: true,
        maxAge: 86400, // 24 hours
        staleWhileRevalidate: 300 // 5 minutes
      },
      compression: {
        enabled: true,
        level: 6
      },
      minification: {
        enabled: true,
        html: true,
        css: true,
        js: true
      }
    },
    
    // Analytics settings
    analytics: {
      enabled: true,
      provider: 'google', // google, plausible, or custom
      trackingId: process.env.GA_TRACKING_ID || null,
      privacy: {
        anonymizeIp: true,
        respectDnt: true
      }
    },
    
    // Notification settings
    notifications: {
      deployment: {
        success: true,
        failure: true,
        email: process.env.NOTIFICATION_EMAIL || null,
        slack: process.env.SLACK_WEBHOOK || null
      },
      monitoring: {
        downtime: true,
        recovery: true
      }
    }
  },
  
  // Environment-specific overrides
  environments: {
    development: {
      currentProvider: 'github_pages',
      providers: {
        github_pages: {
          baseUrl: 'http://localhost:4000',
          autoDeploy: false
        }
      }
    },
    
    staging: {
      currentProvider: 'firebase_hosting',
      providers: {
        firebase_hosting: {
          projectId: 'tracker-staging',
          baseUrl: 'https://tracker-staging.web.app'
        }
      }
    },
    
    production: {
      currentProvider: 'github_pages',
      providers: {
        github_pages: {
          baseUrl: 'https://zebrastribe.github.io/trace',
          autoDeploy: true
        }
      }
    }
  }
};

/**
 * Get configuration for current environment
 */
export function getConfig(environment = process.env.NODE_ENV || 'development') {
  const baseConfig = { ...hostingConfig };
  const envConfig = hostingConfig.environments[environment] || {};
  
  // Merge environment-specific configuration
  if (envConfig.currentProvider) {
    baseConfig.currentProvider = envConfig.currentProvider;
  }
  
  if (envConfig.providers) {
    Object.keys(envConfig.providers).forEach(provider => {
      if (!baseConfig.providers[provider]) {
        baseConfig.providers[provider] = {};
      }
      baseConfig.providers[provider] = {
        ...baseConfig.providers[provider],
        ...envConfig.providers[provider]
      };
    });
  }
  
  return baseConfig;
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];
  
  // Check current provider exists
  if (!config.providers[config.currentProvider]) {
    errors.push(`Current provider '${config.currentProvider}' not found in providers configuration`);
  }
  
  // Validate each provider
  Object.entries(config.providers).forEach(([name, provider]) => {
    if (!provider.baseUrl) {
      errors.push(`Provider '${name}' missing baseUrl`);
    }
    
    if (!provider.deploymentMethod) {
      errors.push(`Provider '${name}' missing deploymentMethod`);
    }
    
    // Provider-specific validation
    if (name === 'github_pages') {
      if (!provider.repoOwner || !provider.repoName) {
        errors.push(`GitHub Pages provider missing repoOwner or repoName`);
      }
    }
    
    if (name === 'firebase_hosting') {
      if (!provider.projectId) {
        errors.push(`Firebase Hosting provider missing projectId`);
      }
    }
    
    if (name === 'custom') {
      if (!provider.ssh.host && !provider.ftp.host) {
        errors.push(`Custom provider missing SSH or FTP configuration`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get provider configuration
 */
export function getProviderConfig(providerName, environment = process.env.NODE_ENV || 'development') {
  const config = getConfig(environment);
  return config.providers[providerName];
}

/**
 * Get current provider configuration
 */
export function getCurrentProviderConfig(environment = process.env.NODE_ENV || 'development') {
  const config = getConfig(environment);
  return config.providers[config.currentProvider];
}

/**
 * Check if provider is available
 */
export function isProviderAvailable(providerName, environment = process.env.NODE_ENV || 'development') {
  const config = getConfig(environment);
  return !!config.providers[providerName];
}

/**
 * Get available providers
 */
export function getAvailableProviders(environment = process.env.NODE_ENV || 'development') {
  const config = getConfig(environment);
  return Object.keys(config.providers);
}

export default hostingConfig; 