/**
 * DNS Manager for Simply.com API Integration
 * 
 * @class DNSManager
 * @description Manages DNS records through Simply.com API for dynamic subdomain creation
 */

export class DNSManager {
  constructor(apiKey, config = {}) {
    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl || 'https://api.simply.com/v1';
    this.domain = config.domain || 'stri.be';
    this.defaultTTL = config.defaultTTL || 300;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Create subdomain for a pet
   */
  async createSubdomain(petName) {
    const domain = `${petName.toLowerCase()}.${this.domain}`;
    
    try {
      console.log(`🌐 Creating DNS record for ${domain}...`);
      
      const cnameRecord = {
        type: 'CNAME',
        name: domain,
        value: 'zebrastribe.github.io',
        ttl: this.defaultTTL
      };
      
      const response = await this.makeRequest('POST', `/domains/${this.domain}/records`, cnameRecord);
      
      if (response.success) {
        console.log(`✅ Successfully created DNS record for ${domain}`);
        return { 
          domain, 
          status: 'created',
          record: cnameRecord,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`DNS creation failed: ${response.message}`);
      }
    } catch (error) {
      console.error(`❌ Error creating DNS record for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Delete subdomain for a pet
   */
  async deleteSubdomain(petName) {
    const domain = `${petName.toLowerCase()}.${this.domain}`;
    
    try {
      console.log(`🗑️ Deleting DNS record for ${domain}...`);
      
      // First, get the record ID
      const records = await this.getDomainRecords();
      const record = records.find(r => r.name === domain && r.type === 'CNAME');
      
      if (!record) {
        console.log(`ℹ️ No DNS record found for ${domain}`);
        return { domain, status: 'not_found' };
      }
      
      const response = await this.makeRequest('DELETE', `/domains/${this.domain}/records/${record.id}`);
      
      if (response.success) {
        console.log(`✅ Successfully deleted DNS record for ${domain}`);
        return { 
          domain, 
          status: 'deleted',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`DNS deletion failed: ${response.message}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting DNS record for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Update subdomain record
   */
  async updateSubdomain(petName, newValue) {
    const domain = `${petName.toLowerCase()}.${this.domain}`;
    
    try {
      console.log(`🔄 Updating DNS record for ${domain}...`);
      
      // First, get the record ID
      const records = await this.getDomainRecords();
      const record = records.find(r => r.name === domain && r.type === 'CNAME');
      
      if (!record) {
        throw new Error(`No DNS record found for ${domain}`);
      }
      
      const updateData = {
        type: 'CNAME',
        name: domain,
        value: newValue,
        ttl: this.defaultTTL
      };
      
      const response = await this.makeRequest('PUT', `/domains/${this.domain}/records/${record.id}`, updateData);
      
      if (response.success) {
        console.log(`✅ Successfully updated DNS record for ${domain}`);
        return { 
          domain, 
          status: 'updated',
          record: updateData,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`DNS update failed: ${response.message}`);
      }
    } catch (error) {
      console.error(`❌ Error updating DNS record for ${domain}:`, error);
      throw error;
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
   * Check if subdomain exists
   */
  async subdomainExists(petName) {
    try {
      const domain = `${petName.toLowerCase()}.${this.domain}`;
      const records = await this.getDomainRecords();
      
      return records.some(record => 
        record.name === domain && record.type === 'CNAME'
      );
    } catch (error) {
      console.error('Error checking subdomain existence:', error);
      return false;
    }
  }

  /**
   * Get subdomain information
   */
  async getSubdomainInfo(petName) {
    try {
      const domain = `${petName.toLowerCase()}.${this.domain}`;
      const records = await this.getDomainRecords();
      const record = records.find(r => r.name === domain && r.type === 'CNAME');
      
      if (!record) {
        return null;
      }
      
      return {
        domain,
        record,
        created: record.created_at,
        updated: record.updated_at,
        status: 'active'
      };
    } catch (error) {
      console.error('Error getting subdomain info:', error);
      throw error;
    }
  }

  /**
   * Bulk create subdomains
   */
  async bulkCreateSubdomains(petNames) {
    const results = [];
    
    for (const petName of petNames) {
      try {
        const result = await this.createSubdomain(petName);
        results.push({ petName, ...result });
        
        // Add delay between requests to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        results.push({ 
          petName, 
          status: 'failed', 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Bulk delete subdomains
   */
  async bulkDeleteSubdomains(petNames) {
    const results = [];
    
    for (const petName of petNames) {
      try {
        const result = await this.deleteSubdomain(petName);
        results.push({ petName, ...result });
        
        // Add delay between requests to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        results.push({ 
          petName, 
          status: 'failed', 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Validate domain name
   */
  validateDomainName(petName) {
    // Check if pet name is valid for DNS
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    
    if (!domainRegex.test(petName.toLowerCase())) {
      throw new Error(`Invalid domain name: ${petName}. Domain names must contain only letters, numbers, and hyphens, and cannot start or end with a hyphen.`);
    }
    
    if (petName.length > 63) {
      throw new Error(`Domain name too long: ${petName}. Maximum length is 63 characters.`);
    }
    
    return true;
  }

  /**
   * Check DNS propagation
   */
  async checkDNSPropagation(petName, maxAttempts = 10) {
    const domain = `${petName.toLowerCase()}.${this.domain}`;
    
    console.log(`🔍 Checking DNS propagation for ${domain}...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
        const data = await response.json();
        
        if (data.Answer && data.Answer.length > 0) {
          const cnameRecord = data.Answer.find(answer => answer.type === 5);
          if (cnameRecord && cnameRecord.data === 'zebrastribe.github.io.') {
            console.log(`✅ DNS propagation successful for ${domain} (attempt ${attempt})`);
            return {
              domain,
              status: 'propagated',
              attempts: attempt,
              timestamp: new Date().toISOString()
            };
          }
        }
        
        console.log(`⏳ DNS propagation not ready for ${domain} (attempt ${attempt}/${maxAttempts})`);
        
        if (attempt < maxAttempts) {
          await this.delay(30000); // Wait 30 seconds between attempts
        }
      } catch (error) {
        console.error(`Error checking DNS propagation (attempt ${attempt}):`, error);
      }
    }
    
    console.log(`❌ DNS propagation failed for ${domain} after ${maxAttempts} attempts`);
    return {
      domain,
      status: 'failed',
      attempts: maxAttempts,
      timestamp: new Date().toISOString()
    };
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
            'Authorization': `Bearer ${this.apiKey}`,
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
}

export default DNSManager; 