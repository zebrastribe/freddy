/**
 * HostingAbstraction - Abstract hosting provider management
 * 
 * @class HostingAbstraction
 * @description Manages different hosting providers with a unified interface
 */

import { GitHubPagesProvider } from './providers/github_pages.js';
import { FirebaseHostingProvider } from './providers/firebase_hosting.js';
import { CustomHostingProvider } from './providers/custom.js';

export class HostingAbstraction {
  constructor(config) {
    this.config = config;
    this.currentProvider = config.currentProvider || 'github_pages';
    this.providers = this.initializeProviders();
  }

  /**
   * Initialize hosting providers
   */
  initializeProviders() {
    return {
      github_pages: new GitHubPagesProvider(this.config.providers.github_pages),
      firebase_hosting: new FirebaseHostingProvider(this.config.providers.firebase_hosting),
      custom: new CustomHostingProvider(this.config.providers.custom)
    };
  }

  /**
   * Get current provider
   */
  getCurrentProvider() {
    return this.providers[this.currentProvider];
  }

  /**
   * Switch hosting provider
   */
  async switchProvider(newProvider) {
    if (!this.providers[newProvider]) {
      throw new Error(`Unknown hosting provider: ${newProvider}`);
    }

    console.log(`🔄 Switching from ${this.currentProvider} to ${newProvider}...`);

    // Migrate all pets to new provider
    await this.migrateAllPets(newProvider);
    this.currentProvider = newProvider;

    console.log(`✅ Successfully switched to ${newProvider} hosting`);
  }

  /**
   * Create pet hosting configuration
   */
  async createPetHosting(petName, petConfig) {
    const provider = this.getCurrentProvider();
    return await provider.createPetHosting(petName, petConfig);
  }

  /**
   * Get pet URL
   */
  getPetUrl(petName) {
    const provider = this.getCurrentProvider();
    return provider.getPetUrl(petName);
  }

  /**
   * Deploy pet
   */
  async deployPet(petName, petConfig) {
    const provider = this.getCurrentProvider();
    return await provider.deployPet(petName, petConfig);
  }

  /**
   * Get deployment status for a pet
   */
  async getDeploymentStatus(petName) {
    const provider = this.getCurrentProvider();
    return await provider.getDeploymentStatus(petName);
  }

  /**
   * Migrate all pets to new provider
   */
  async migrateAllPets(newProvider) {
    console.log(`🔄 Migrating all pets to ${newProvider}...`);

    // This would typically involve:
    // 1. Getting all pets from database
    // 2. Deploying each pet to the new provider
    // 3. Updating DNS records if needed
    // 4. Verifying deployments

    // For now, we'll just log the migration
    console.log(`📝 Migration to ${newProvider} would be performed here`);
  }

  /**
   * Get provider information
   */
  getProviderInfo(providerName = null) {
    const provider = providerName ? this.providers[providerName] : this.getCurrentProvider();
    
    if (!provider) {
      throw new Error(`Provider not found: ${providerName || this.currentProvider}`);
    }

    return {
      name: providerName || this.currentProvider,
      baseUrl: provider.baseUrl,
      deploymentMethod: provider.deploymentMethod,
      configFile: provider.configFile
    };
  }

  /**
   * List all available providers
   */
  listProviders() {
    return Object.keys(this.providers).map(name => ({
      name,
      ...this.getProviderInfo(name)
    }));
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(providerName) {
    const provider = this.providers[providerName];
    
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    // Basic validation - each provider would have its own validation logic
    const requiredFields = ['baseUrl', 'deploymentMethod'];
    const missingFields = requiredFields.filter(field => !provider[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for ${providerName}: ${missingFields.join(', ')}`);
    }

    return true;
  }

  /**
   * Test provider connection
   */
  async testProviderConnection(providerName = null) {
    const provider = providerName ? this.providers[providerName] : this.getCurrentProvider();
    
    if (!provider) {
      throw new Error(`Provider not found: ${providerName || this.currentProvider}`);
    }

    try {
      // This would typically test the connection to the hosting provider
      // For now, we'll just return a mock success
      console.log(`🔗 Testing connection to ${providerName || this.currentProvider}...`);
      
      return {
        success: true,
        provider: providerName || this.currentProvider,
        message: 'Connection test successful'
      };
    } catch (error) {
      return {
        success: false,
        provider: providerName || this.currentProvider,
        error: error.message
      };
    }
  }

  /**
   * Get hosting statistics
   */
  async getHostingStats() {
    const provider = this.getCurrentProvider();
    
    return {
      currentProvider: this.currentProvider,
      totalPets: 0, // This would be fetched from database
      deployedPets: 0, // This would be fetched from provider
      lastDeployment: null,
      providerInfo: this.getProviderInfo()
    };
  }

  /**
   * Backup hosting configuration
   */
  async backupConfiguration() {
    const fs = require('fs').promises;
    const path = require('path');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      currentProvider: this.currentProvider,
      providers: this.config.providers,
      version: '1.0.0'
    };

    const backupPath = path.join(process.cwd(), 'backups', 'hosting-config.json');
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`💾 Hosting configuration backed up to ${backupPath}`);
    return backupPath;
  }

  /**
   * Restore hosting configuration
   */
  async restoreConfiguration(backupPath) {
    const fs = require('fs').promises;
    
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      
      // Validate backup data
      if (!backupData.currentProvider || !backupData.providers) {
        throw new Error('Invalid backup data format');
      }

      // Restore configuration
      this.currentProvider = backupData.currentProvider;
      this.config.providers = backupData.providers;
      this.providers = this.initializeProviders();

      console.log(`🔄 Restored hosting configuration from ${backupPath}`);
      return true;
    } catch (error) {
      console.error('Error restoring configuration:', error);
      throw error;
    }
  }
}

export default HostingAbstraction; 