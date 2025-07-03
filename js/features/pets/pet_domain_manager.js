/**
 * Pet Domain Manager
 * 
 * @class PetDomainManager
 * @description Manages complete pet domain setup including DNS and hosting deployment
 */

import { DNSManager } from '../infrastructure/dns_manager.js';
import { HostingAbstraction } from '../../hosting/hosting_abstraction.js';
import { URLRouter } from '../../hosting/url_router.js';

export class PetDomainManager {
  constructor(dnsManager, hostingAbstraction, urlRouter) {
    this.dnsManager = dnsManager;
    this.hostingAbstraction = hostingAbstraction;
    this.urlRouter = urlRouter;
  }
  
  /**
   * Create pet with complete domain setup
   */
  async createPetWithDomain(petData) {
    try {
      console.log(`🚀 Creating pet with domain: ${petData.name}`);
      
      // 1. Validate pet name for DNS
      this.dnsManager.validateDomainName(petData.name);
      
      // 2. Check if domain already exists
      const domainExists = await this.dnsManager.subdomainExists(petData.name);
      if (domainExists) {
        throw new Error(`Domain ${petData.name}.stri.be already exists`);
      }
      
      // 3. Create pet in database (this would be handled by PetManager)
      // const pet = await this.createPet(petData);
      
      // 4. Create hosting configuration
      const hostingConfig = await this.hostingAbstraction.createPetHosting(petData.name, petData);
      
      // 5. Create DNS record
      const dnsResult = await this.dnsManager.createSubdomain(petData.name);
      
      // 6. Deploy to hosting provider
      const deploymentResult = await this.hostingAbstraction.deployPet(petData.name, petData);
      
      // 7. Update pet with domain and hosting info
      const updatedPetData = {
        ...petData,
        domain: `${petData.name}.stri.be`,
        hosting: hostingConfig,
        dnsRecord: dnsResult.record,
        deploymentStatus: deploymentResult.status
      };
      
      // 8. Check DNS propagation
      const propagationResult = await this.dnsManager.checkDNSPropagation(petData.name);
      
      console.log(`✅ Successfully created pet with domain: ${petData.name}`);
      
      return {
        success: true,
        pet: updatedPetData,
        dns: dnsResult,
        hosting: deploymentResult,
        propagation: propagationResult,
        url: this.urlRouter.getPetUrl(petData.name)
      };
    } catch (error) {
      console.error('Error creating pet with domain:', error);
      throw error;
    }
  }

  /**
   * Update pet domain configuration
   */
  async updatePetDomain(petName, updates) {
    try {
      console.log(`🔄 Updating domain for pet: ${petName}`);
      
      const results = {};
      
      // Update DNS if needed
      if (updates.hosting && updates.hosting.baseUrl) {
        const dnsResult = await this.dnsManager.updateSubdomain(petName, updates.hosting.baseUrl);
        results.dns = dnsResult;
      }
      
      // Update hosting if needed
      if (updates.hosting) {
        const hostingResult = await this.hostingAbstraction.deployPet(petName, updates);
        results.hosting = hostingResult;
      }
      
      console.log(`✅ Successfully updated domain for pet: ${petName}`);
      
      return {
        success: true,
        petName,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating pet domain:', error);
      throw error;
    }
  }

  /**
   * Delete pet domain
   */
  async deletePetDomain(petName) {
    try {
      console.log(`🗑️ Deleting domain for pet: ${petName}`);
      
      // 1. Delete DNS record
      const dnsResult = await this.dnsManager.deleteSubdomain(petName);
      
      // 2. Remove from hosting (this would depend on the hosting provider)
      // For now, we'll just log this step
      console.log(`📝 Hosting cleanup for ${petName} would be performed here`);
      
      console.log(`✅ Successfully deleted domain for pet: ${petName}`);
      
      return {
        success: true,
        petName,
        dns: dnsResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error deleting pet domain:', error);
      throw error;
    }
  }

  /**
   * Switch hosting provider for all pets
   */
  async switchHostingProvider(newProvider) {
    try {
      console.log(`🔄 Switching hosting provider to: ${newProvider}`);
      
      // 1. Switch provider in hosting abstraction
      await this.hostingAbstraction.switchProvider(newProvider);
      
      // 2. Update all pets with new hosting configuration
      // This would typically fetch all pets from the database
      const pets = [
        { name: 'freddy', domain: 'freddy.stri.be' },
        { name: 'anna', domain: 'anna.stri.be' }
      ];
      
      const results = [];
      
      for (const pet of pets) {
        try {
          const newHostingConfig = await this.hostingAbstraction.createPetHosting(pet.name, pet);
          
          // Update DNS to point to new hosting provider
          const dnsResult = await this.dnsManager.updateSubdomain(pet.name, newHostingConfig.baseUrl);
          
          results.push({
            petName: pet.name,
            success: true,
            hosting: newHostingConfig,
            dns: dnsResult
          });
        } catch (error) {
          results.push({
            petName: pet.name,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log(`✅ Successfully switched to ${newProvider} hosting`);
      
      return {
        success: true,
        newProvider,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error switching hosting provider:', error);
      throw error;
    }
  }

  /**
   * Get pet URL regardless of hosting provider
   */
  getPetUrl(petName) {
    return this.urlRouter.getPetUrl(petName);
  }

  /**
   * Get domain information for a pet
   */
  async getPetDomainInfo(petName) {
    try {
      const dnsInfo = await this.dnsManager.getSubdomainInfo(petName);
      const hostingStatus = await this.hostingAbstraction.getDeploymentStatus(petName);
      
      return {
        petName,
        domain: `${petName}.stri.be`,
        dns: dnsInfo,
        hosting: hostingStatus,
        url: this.getPetUrl(petName),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting pet domain info:', error);
      throw error;
    }
  }

  /**
   * Check domain health for a pet
   */
  async checkPetDomainHealth(petName) {
    try {
      console.log(`🏥 Checking domain health for: ${petName}`);
      
      const healthChecks = [];
      
      // 1. Check DNS propagation
      const dnsHealth = await this.dnsManager.checkDNSPropagation(petName, 3);
      healthChecks.push({
        type: 'dns',
        status: dnsHealth.status === 'propagated' ? 'healthy' : 'unhealthy',
        details: dnsHealth
      });
      
      // 2. Check hosting deployment
      const hostingHealth = await this.hostingAbstraction.getDeploymentStatus(petName);
      healthChecks.push({
        type: 'hosting',
        status: hostingHealth.status === 'deployed' ? 'healthy' : 'unhealthy',
        details: hostingHealth
      });
      
      // 3. Check URL accessibility
      const urlHealth = await this.checkUrlAccessibility(petName);
      healthChecks.push({
        type: 'url',
        status: urlHealth.status === 'accessible' ? 'healthy' : 'unhealthy',
        details: urlHealth
      });
      
      const overallHealth = healthChecks.every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy';
      
      return {
        petName,
        domain: `${petName}.stri.be`,
        overallHealth,
        checks: healthChecks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking pet domain health:', error);
      throw error;
    }
  }

  /**
   * Check URL accessibility
   */
  async checkUrlAccessibility(petName) {
    try {
      const url = this.getPetUrl(petName);
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 10000 
      });
      
      return {
        status: response.ok ? 'accessible' : 'unhealthy',
        statusCode: response.status,
        url: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        url: this.getPetUrl(petName),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Bulk domain operations
   */
  async bulkCreateDomains(petNames) {
    console.log(`🚀 Bulk creating domains for ${petNames.length} pets`);
    
    const results = [];
    
    for (const petName of petNames) {
      try {
        const petData = {
          name: petName,
          type: 'cat',
          breed: 'unknown',
          status: 'active',
          isPublic: true,
          metadata: {
            description: `Track ${petName}'s location and status`
          }
        };
        
        const result = await this.createPetWithDomain(petData);
        results.push({ petName, success: true, ...result });
        
        // Add delay between operations
        await this.delay(2000);
      } catch (error) {
        results.push({ 
          petName, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return {
      total: petNames.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Bulk delete domains
   */
  async bulkDeleteDomains(petNames) {
    console.log(`🗑️ Bulk deleting domains for ${petNames.length} pets`);
    
    const results = [];
    
    for (const petName of petNames) {
      try {
        const result = await this.deletePetDomain(petName);
        results.push({ petName, success: true, ...result });
        
        // Add delay between operations
        await this.delay(1000);
      } catch (error) {
        results.push({ 
          petName, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return {
      total: petNames.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Get domain statistics
   */
  async getDomainStats() {
    try {
      const dnsStats = await this.dnsManager.getDNSStats();
      const hostingStats = await this.hostingAbstraction.getHostingStats();
      
      return {
        dns: dnsStats,
        hosting: hostingStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting domain stats:', error);
      throw error;
    }
  }

  /**
   * Validate domain configuration
   */
  validateDomainConfiguration(petData) {
    const errors = [];
    
    // Check pet name
    try {
      this.dnsManager.validateDomainName(petData.name);
    } catch (error) {
      errors.push(`Pet name validation: ${error.message}`);
    }
    
    // Check required fields
    if (!petData.name) {
      errors.push('Pet name is required');
    }
    
    if (!petData.type) {
      errors.push('Pet type is required');
    }
    
    if (!petData.breed) {
      errors.push('Pet breed is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Delay utility function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test domain manager functionality
   */
  async testDomainManager() {
    console.log('🧪 Testing domain manager functionality...');
    
    const tests = [];
    
    // Test DNS connection
    try {
      const dnsTest = await this.dnsManager.testConnection();
      tests.push({ name: 'DNS Connection', success: dnsTest.success, details: dnsTest });
    } catch (error) {
      tests.push({ name: 'DNS Connection', success: false, error: error.message });
    }
    
    // Test hosting connection
    try {
      const hostingTest = await this.hostingAbstraction.testProviderConnection();
      tests.push({ name: 'Hosting Connection', success: hostingTest.success, details: hostingTest });
    } catch (error) {
      tests.push({ name: 'Hosting Connection', success: false, error: error.message });
    }
    
    // Test URL router
    try {
      const testUrl = this.urlRouter.getPetUrl('test');
      tests.push({ name: 'URL Router', success: true, details: { testUrl } });
    } catch (error) {
      tests.push({ name: 'URL Router', success: false, error: error.message });
    }
    
    const allTestsPassed = tests.every(test => test.success);
    
    return {
      success: allTestsPassed,
      tests,
      timestamp: new Date().toISOString()
    };
  }
}

export default PetDomainManager; 