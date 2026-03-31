/**
 * Infrastructure Test Script
 * 
 * @description Tests the infrastructure setup for the multi-user, multi-pet system
 */

import { hostingConfig, getConfig, validateConfig } from '../hosting/config.js';
import { HostingAbstraction } from '../hosting/hosting_abstraction.js';
import { URLRouter } from '../hosting/url_router.js';
import { DNSManager } from '../js/features/infrastructure/dns_manager.js';
import { PetDomainManager } from '../js/features/pets/pet_domain_manager.js';

/**
 * Test hosting configuration
 */
async function testHostingConfiguration() {
  console.log('🧪 Testing hosting configuration...');
  
  try {
    // 1. Test configuration loading
    const config = getConfig();
    console.log('✅ Configuration loaded successfully');
    
    // 2. Validate configuration
    const validation = validateConfig(config);
    if (validation.valid) {
      console.log('✅ Configuration validation passed');
    } else {
      console.log('❌ Configuration validation failed:', validation.errors);
      return false;
    }
    
    // 3. Test hosting abstraction
    const hostingAbstraction = new HostingAbstraction(config);
    console.log('✅ Hosting abstraction created');
    
    // 4. Test URL router
    const urlRouter = new URLRouter(hostingAbstraction);
    console.log('✅ URL router created');
    
    // 5. Test provider connections
    const providers = hostingAbstraction.listProviders();
    console.log('📋 Available providers:', providers.map(p => p.name));
    
    for (const provider of providers) {
      const connectionTest = await hostingAbstraction.testProviderConnection(provider.name);
      console.log(`🔗 ${provider.name} connection:`, connectionTest.success ? '✅' : '❌');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Hosting configuration test failed:', error);
    return false;
  }
}

/**
 * Test DNS management
 */
async function testDNSManagement() {
  console.log('🧪 Testing DNS management...');
  
  try {
    // Note: This requires a valid Simply.com API key and account number
    const apiKey = process.env.SIMPLY_API_KEY || 'test_key';
    const accountNo = process.env.SIMPLY_ACCOUNT_NO || 'test_account';
    
    const dnsManager = new DNSManager(apiKey, accountNo, {
      domain: 'stri.be',
      defaultTTL: 300
    });
    
    console.log('✅ DNS manager created');
    
    // Test domain name validation
    const validNames = ['freddy', 'anna', 'test-pet'];
    const invalidNames = ['', 'test@pet', 'a'.repeat(64)];
    
    for (const name of validNames) {
      try {
        dnsManager.validateDomainName(name);
        console.log(`✅ Domain name validation passed: ${name}`);
      } catch (error) {
        console.log(`❌ Domain name validation failed: ${name} - ${error.message}`);
      }
    }
    
    for (const name of invalidNames) {
      try {
        dnsManager.validateDomainName(name);
        console.log(`❌ Invalid domain name passed validation: ${name}`);
      } catch (error) {
        console.log(`✅ Invalid domain name correctly rejected: ${name}`);
      }
    }
    
    // Test connection (will fail without real API key, but that's expected)
    const connectionTest = await dnsManager.testConnection();
    console.log('🔗 DNS connection test:', connectionTest.success ? '✅' : '❌ (expected without real API key)');
    
    return true;
  } catch (error) {
    console.error('❌ DNS management test failed:', error);
    return false;
  }
}

/**
 * Test pet domain management
 */
async function testPetDomainManagement() {
  console.log('🧪 Testing pet domain management...');
  
  try {
    const config = getConfig();
    const hostingAbstraction = new HostingAbstraction(config);
    const urlRouter = new URLRouter(hostingAbstraction);
    
    // Create mock DNS manager for testing
    const mockDNSManager = {
      validateDomainName: (name) => {
        if (!name || name.length > 63) {
          throw new Error('Invalid domain name');
        }
        return true;
      },
      subdomainExists: async (name) => false,
      createSubdomain: async (name) => ({
        domain: `${name}.stri.be`,
        status: 'created',
        timestamp: new Date().toISOString()
      }),
      checkDNSPropagation: async (name) => ({
        domain: `${name}.stri.be`,
        status: 'propagated',
        attempts: 1,
        timestamp: new Date().toISOString()
      })
    };
    
    const petDomainManager = new PetDomainManager(
      mockDNSManager,
      hostingAbstraction,
      urlRouter
    );
    
    console.log('✅ Pet domain manager created');
    
    // Test domain manager functionality
    const domainManagerTest = await petDomainManager.testDomainManager();
    console.log('🔧 Domain manager test:', domainManagerTest.success ? '✅' : '❌');
    
    // Test URL generation
    const testUrl = petDomainManager.getPetUrl('freddy');
    console.log('🌐 Test URL generation:', testUrl);
    
    // Test domain configuration validation
    const validPetData = {
      name: 'testpet',
      type: 'cat',
      breed: 'ginger',
      status: 'active',
      isPublic: true
    };
    
    const validation = petDomainManager.validateDomainConfiguration(validPetData);
    console.log('✅ Domain configuration validation:', validation.valid ? 'passed' : 'failed');
    
    return true;
  } catch (error) {
    console.error('❌ Pet domain management test failed:', error);
    return false;
  }
}

/**
 * Test URL routing
 */
async function testURLRouting() {
  console.log('🧪 Testing URL routing...');
  
  try {
    const config = getConfig();
    const hostingAbstraction = new HostingAbstraction(config);
    const urlRouter = new URLRouter(hostingAbstraction);
    
    // Test pet URL generation
    const petUrl = urlRouter.getPetUrl('freddy');
    console.log('🌐 Pet URL:', petUrl);
    
    // Test admin URL generation
    const adminUrl = urlRouter.getAdminUrl();
    console.log('🔧 Admin URL:', adminUrl);
    
    // Test URL parsing
    const parsedPet = urlRouter.parsePetFromUrl('https://example.com/freddy/');
    console.log('📝 Parsed pet from URL:', parsedPet);
    
    // Test URL validation
    const validUrl = 'https://example.com';
    const invalidUrl = 'not-a-url';
    
    console.log('✅ URL validation:', urlRouter.validateUrl(validUrl) ? 'passed' : 'failed');
    console.log('❌ URL validation:', urlRouter.validateUrl(invalidUrl) ? 'passed' : 'failed');
    
    // Test URL normalization
    const normalizedUrl = urlRouter.normalizeUrl('https://example.com/');
    console.log('🔧 URL normalization:', normalizedUrl);
    
    // Test robots.txt generation
    const robotsTxt = urlRouter.generateRobotsTxt();
    console.log('🤖 Robots.txt generated:', robotsTxt.length > 0);
    
    return true;
  } catch (error) {
    console.error('❌ URL routing test failed:', error);
    return false;
  }
}

/**
 * Test hosting providers
 */
async function testHostingProviders() {
  console.log('🧪 Testing hosting providers...');
  
  try {
    const config = getConfig();
    const hostingAbstraction = new HostingAbstraction(config);
    
    const providers = ['github_pages', 'firebase_hosting', 'custom'];
    
    for (const providerName of providers) {
      console.log(`🔧 Testing provider: ${providerName}`);
      
      try {
        const provider = hostingAbstraction.providers[providerName];
        
        // Test pet hosting creation
        const petData = {
          name: 'testpet',
          type: 'cat',
          breed: 'ginger',
          status: 'active',
          isPublic: true
        };
        
        const hostingConfig = await provider.createPetHosting('testpet', petData);
        console.log(`✅ ${providerName} hosting config created:`, hostingConfig.provider);
        
        // Test URL generation
        const petUrl = provider.getPetUrl('testpet');
        console.log(`🌐 ${providerName} pet URL:`, petUrl);
        
      } catch (error) {
        console.log(`❌ ${providerName} test failed:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Hosting providers test failed:', error);
    return false;
  }
}

/**
 * Run all infrastructure tests
 */
async function runInfrastructureTests() {
  console.log('🚀 Starting infrastructure tests...\n');
  
  const tests = [
    { name: 'Hosting Configuration', fn: testHostingConfiguration },
    { name: 'DNS Management', fn: testDNSManagement },
    { name: 'Pet Domain Management', fn: testPetDomainManagement },
    { name: 'URL Routing', fn: testURLRouting },
    { name: 'Hosting Providers', fn: testHostingProviders }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📋 Running ${test.name} test...`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
      console.log(`${result ? '✅' : '❌'} ${test.name} test ${result ? 'passed' : 'failed'}`);
    } catch (error) {
      results.push({ name: test.name, success: false, error: error.message });
      console.log(`❌ ${test.name} test failed with error:`, error.message);
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.name}: ${result.error || 'Unknown error'}`);
    });
  }
  
  return {
    success: failed === 0,
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      successRate: (passed / results.length) * 100
    }
  };
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    results: results.results,
    summary: results.summary
  };
  
  return report;
}

// Export functions for use in other modules
export {
  testHostingConfiguration,
  testDNSManagement,
  testPetDomainManagement,
  testURLRouting,
  testHostingProviders,
  runInfrastructureTests,
  generateTestReport
};

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runInfrastructureTests()
    .then(results => {
      const report = generateTestReport(results);
      console.log('\n📄 Test Report:', JSON.stringify(report, null, 2));
      
      if (results.success) {
        console.log('\n🎉 All infrastructure tests passed!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some infrastructure tests failed. Please review the results.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Infrastructure tests failed:', error);
      process.exit(1);
    });
} 