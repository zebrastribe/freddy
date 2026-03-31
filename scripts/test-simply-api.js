/**
 * Simply.com API Test Script
 * 
 * This script tests the Simply.com API integration using the provided credentials
 */

// CommonJS version of DNSManager for Node.js testing
class DNSManager {
  constructor(apiKey, accountNo, config = {}) {
    this.apiKey = apiKey;
    this.accountNo = accountNo; // Simply.com account number (e.g., Sxxxxxx)
    this.baseUrl = config.baseUrl || 'https://api.simply.com/2'; // Updated to API v2
    this.domain = config.domain || 'stri.be';
    this.defaultTTL = config.defaultTTL || 300;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('GET', `/domains/${this.domain}`);
      
      if (response.success) {
        console.log('✅ DNS API connection successful');
        return {
          success: true,
          domain: this.domain,
          message: 'Connection test successful'
        };
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      console.error('❌ DNS API connection failed:', error);
      return {
        success: false,
        domain: this.domain,
        error: error.message
      };
    }
  }

  /**
   * Get all domain records
   */
  async getDomainRecords() {
    try {
      const response = await this.makeRequest('GET', `/domains/${this.domain}/records`);
      
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(`Failed to get domain records: ${response.message}`);
      }
    } catch (error) {
      console.error('Error getting domain records:', error);
      throw error;
    }
  }

  /**
   * Get DNS statistics
   */
  async getDNSStats() {
    try {
      const records = await this.getDomainRecords();
      const cnameRecords = records.filter(r => r.type === 'CNAME');
      
      return {
        totalRecords: records.length,
        cnameRecords: cnameRecords.length,
        subdomains: cnameRecords.filter(r => r.name.endsWith(`.${this.domain}`)).length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting DNS stats:', error);
      throw error;
    }
  }

  /**
   * Get API rate limit information
   */
  async getRateLimitInfo() {
    try {
      const response = await this.makeRequest('GET', '/rate-limits');
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Failed to get rate limit info');
      }
    } catch (error) {
      console.error('Error getting rate limit info:', error);
      return null;
    }
  }

  /**
   * Make API request with retry logic
   */
  async makeRequest(method, endpoint, data = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
          method,
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountNo}:${this.apiKey}`).toString('base64'), // HTTP Basic Auth
            'Content-Type': 'application/json',
            'User-Agent': 'PetTracker-DNSManager/1.0'
          }
        };
        
        if (data) {
          options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            data: responseData,
            status: response.status
          };
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`API request attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Delay utility function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function testSimplyAPI() {
  console.log('🧪 Testing Simply.com API integration...');
  
  // Your Simply.com credentials - Replace with your actual credentials
  const accountNo = process.env.SIMPLY_ACCOUNT_NO || 'Sxxxxxx'; // Your Simply.com account number
  const apiKey = process.env.SIMPLY_API_KEY || 'your-api-key-here'; // Your Simply.com API key
  
  try {
    // Create DNS manager instance
    const dnsManager = new DNSManager(apiKey, accountNo, {
      domain: 'stri.be',
      defaultTTL: 300
    });
    
    console.log('✅ DNS manager created with credentials');
    console.log(`📧 Account: ${accountNo}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`🌐 Domain: ${dnsManager.domain}`);
    console.log(`🔗 API URL: ${dnsManager.baseUrl}`);
    
    // Test connection
    console.log('\n🔍 Testing API connection...');
    const connectionTest = await dnsManager.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ API connection successful!');
      console.log(`📊 Domain info: ${connectionTest.domain}`);
      console.log(`💬 Message: ${connectionTest.message}`);
    } else {
      console.log('❌ API connection failed');
      console.log(`💬 Error: ${connectionTest.error}`);
    }
    
    // Test getting domain records
    console.log('\n📋 Testing domain records retrieval...');
    try {
      const records = await dnsManager.getDomainRecords();
      console.log(`✅ Found ${records.length} DNS records`);
      
      // Show CNAME records for subdomains
      const cnameRecords = records.filter(r => r.type === 'CNAME' && r.name.endsWith('.stri.be'));
      console.log(`📝 Found ${cnameRecords.length} CNAME subdomain records:`);
      
      cnameRecords.forEach(record => {
        console.log(`  - ${record.name} → ${record.value}`);
      });
      
    } catch (error) {
      console.log('❌ Failed to get domain records:', error.message);
    }
    
    // Test rate limit info
    console.log('\n⏱️ Testing rate limit info...');
    try {
      const rateLimitInfo = await dnsManager.getRateLimitInfo();
      if (rateLimitInfo) {
        console.log('✅ Rate limit info retrieved');
        console.log('📊 Rate limit details:', JSON.stringify(rateLimitInfo, null, 2));
      } else {
        console.log('ℹ️ Rate limit info not available');
      }
    } catch (error) {
      console.log('❌ Failed to get rate limit info:', error.message);
    }
    
    // Test DNS stats
    console.log('\n📊 Testing DNS statistics...');
    try {
      const stats = await dnsManager.getDNSStats();
      console.log('✅ DNS statistics retrieved');
      console.log(`📈 Total records: ${stats.totalRecords}`);
      console.log(`🔗 CNAME records: ${stats.cnameRecords}`);
      console.log(`🌐 Subdomains: ${stats.subdomains}`);
      console.log(`🕒 Last updated: ${stats.lastUpdated}`);
    } catch (error) {
      console.log('❌ Failed to get DNS stats:', error.message);
    }
    
    console.log('\n🎉 Simply.com API test completed!');
    
  } catch (error) {
    console.error('❌ Simply.com API test failed:', error);
    console.error('💡 Make sure your credentials are correct and the domain is properly configured');
  }
}

// Run the test
if (require.main === module) {
  testSimplyAPI().catch(console.error);
}

module.exports = { testSimplyAPI, DNSManager }; 