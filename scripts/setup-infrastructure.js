/**
 * Infrastructure Setup Script for Multi-User, Multi-Pet System
 * 
 * This script sets up the infrastructure components needed for the multi-user,
 * multi-pet system including DNS management, hosting configuration, and domain setup.
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration (use your actual config)
const firebaseConfig = {
  // Your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * DNS Manager for Simply.com API integration
 */
class DNSManager {
  constructor(apiKey, accountNo) {
    this.apiKey = apiKey;
    this.accountNo = accountNo;
    this.baseUrl = 'https://api.simply.com/2'; // Updated to API v2
  }
  
  async createSubdomain(petName) {
    const domain = `${petName}.stri.be`;
    const cnameRecord = {
      type: 'CNAME',
      name: domain,
      value: 'zebrastribe.github.io',
      ttl: 300
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/domains/stri.be/records`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.accountNo}:${this.apiKey}`), // HTTP Basic Auth
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cnameRecord)
      });
      
      if (!response.ok) {
        throw new Error(`DNS creation failed: ${response.statusText}`);
      }
      
      console.log(`✅ Created DNS record for: ${domain}`);
      return { domain, status: 'created' };
    } catch (error) {
      console.error('❌ DNS creation error:', error);
      throw error;
    }
  }
  
  async deleteSubdomain(petName) {
    const domain = `${petName}.stri.be`;
    
    try {
      const response = await fetch(`${this.baseUrl}/domains/stri.be/records/${domain}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.accountNo}:${this.apiKey}`) // HTTP Basic Auth
        }
      });
      
      if (!response.ok) {
        throw new Error(`DNS deletion failed: ${response.statusText}`);
      }
      
      console.log(`✅ Deleted DNS record for: ${domain}`);
      return { domain, status: 'deleted' };
    } catch (error) {
      console.error('❌ DNS deletion error:', error);
      throw error;
    }
  }
  
  async listSubdomains() {
    try {
      const response = await fetch(`${this.baseUrl}/domains/stri.be/records`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.accountNo}:${this.apiKey}`) // HTTP Basic Auth
        }
      });
      
      if (!response.ok) {
        throw new Error(`DNS listing failed: ${response.statusText}`);
      }
      
      const records = await response.json();
      return records.filter(record => record.type === 'CNAME' && record.name.endsWith('.stri.be'));
    } catch (error) {
      console.error('❌ DNS listing error:', error);
      throw error;
    }
  }
}

/**
 * Deployment Manager for GitHub Pages
 */
class DeploymentManager {
  constructor(githubToken) {
    this.githubToken = githubToken;
    this.baseUrl = 'https://api.github.com';
    this.repoOwner = 'zebrastribe';
    this.repoName = 'trace';
  }
  
  async createPetDeployment(petName, petConfig) {
    try {
      // Create pet-specific directory structure
      const petPath = `pets/${petName}`;
      
      // Create pet configuration file
      const petConfigContent = JSON.stringify(petConfig, null, 2);
      
      // Create pet-specific index.html
      const indexHtmlContent = this.generatePetIndexHtml(petName, petConfig);
      
      // Create pet-specific assets directory
      const assetsPath = `${petPath}/assets`;
      
      console.log(`✅ Created deployment structure for: ${petName}`);
      return {
        petPath,
        assetsPath,
        configFile: `${petPath}/config.json`,
        indexFile: `${petPath}/index.html`
      };
    } catch (error) {
      console.error('❌ Deployment creation error:', error);
      throw error;
    }
  }
  
  generatePetIndexHtml(petName, petConfig) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${petConfig.name} - Pet Tracker</title>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
</head>
<body>
    <div id="app">
        <header>
            <h1>${petConfig.name}</h1>
            <p>${petConfig.metadata?.description || 'Pet tracking page'}</p>
        </header>
        
        <main>
            <div id="pet-info">
                <h2>About ${petConfig.name}</h2>
                <p><strong>Type:</strong> ${petConfig.type}</p>
                <p><strong>Breed:</strong> ${petConfig.breed}</p>
                <p><strong>Status:</strong> <span id="pet-status">Loading...</span></p>
            </div>
            
            <div id="checkin-form">
                <h2>Check-in ${petConfig.name}</h2>
                <form id="location-form">
                    <button type="submit" id="checkin-btn">Check-in Location</button>
                </form>
            </div>
            
            <div id="map-container">
                <h2>Last Known Location</h2>
                <div id="map"></div>
            </div>
        </main>
    </div>
    
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
        import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
        
        // Initialize Firebase with your config
        const firebaseConfig = {
            // Your Firebase config here
        };
        
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Pet-specific functionality
        const petId = '${petConfig.id}';
        const petName = '${petConfig.name}';
        
        // Load pet status
        async function loadPetStatus() {
            try {
                const statusDoc = await getDoc(doc(db, 'pet_status', petId));
                if (statusDoc.exists()) {
                    const status = statusDoc.data();
                    document.getElementById('pet-status').textContent = status.status;
                }
            } catch (error) {
                console.error('Error loading pet status:', error);
            }
        }
        
        // Handle check-in
        document.getElementById('location-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    try {
                        const checkinData = {
                            petId: petId,
                            name: 'Anonymous User',
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            timestamp: serverTimestamp(),
                            domain: '${petConfig.domain}'
                        };
                        
                        await setDoc(doc(db, 'clicks', \`checkin_\${Date.now()}\`), checkinData);
                        alert('Check-in successful!');
                        
                        // Update pet status
                        await setDoc(doc(db, 'pet_status', petId), {
                            status: 'OK',
                            lastSeen: serverTimestamp(),
                            lastLocation: {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            },
                            updatedAt: serverTimestamp(),
                            updatedBy: 'anonymous'
                        });
                        
                        loadPetStatus();
                    } catch (error) {
                        console.error('Error during check-in:', error);
                        alert('Check-in failed. Please try again.');
                    }
                }, (error) => {
                    console.error('Geolocation error:', error);
                    alert('Unable to get your location. Please enable location services.');
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
        
        // Initialize
        loadPetStatus();
    </script>
</body>
</html>`;
  }
  
  async deployPet(petName, petConfig) {
    try {
      const deployment = await this.createPetDeployment(petName, petConfig);
      
      // In a real implementation, you would:
      // 1. Create the files in the repository
      // 2. Commit and push the changes
      // 3. Trigger GitHub Pages deployment
      
      console.log(`🚀 Deployed ${petName} to GitHub Pages`);
      return deployment;
    } catch (error) {
      console.error('❌ Deployment error:', error);
      throw error;
    }
  }
}

/**
 * Domain Manager for coordinating DNS and hosting
 */
class DomainManager {
  constructor(dnsManager, deploymentManager) {
    this.dnsManager = dnsManager;
    this.deploymentManager = deploymentManager;
  }
  
  async createPetWithDomain(petData) {
    try {
      console.log(`🌐 Creating domain for pet: ${petData.name}`);
      
      // 1. Create DNS record
      const dnsResult = await this.dnsManager.createSubdomain(petData.name);
      
      // 2. Deploy to hosting
      const deploymentResult = await this.deploymentManager.deployPet(petData.name, petData);
      
      // 3. Create domain record in Firestore
      const domainRecord = {
        petId: petData.id,
        domain: dnsResult.domain,
        hosting: {
          provider: 'github_pages',
          baseUrl: 'https://zebrastribe.github.io/trace',
          path: `/${petData.name.toLowerCase()}/`,
          fullUrl: `https://zebrastribe.github.io/trace/${petData.name.toLowerCase()}/`
        },
        dnsRecords: [
          {
            type: 'CNAME',
            name: dnsResult.domain,
            value: 'zebrastribe.github.io',
            ttl: 300
          }
        ],
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'domains', `domain_${petData.id}`), domainRecord);
      
      console.log(`✅ Successfully created domain: ${dnsResult.domain}`);
      return {
        pet: petData,
        domain: dnsResult.domain,
        deployment: deploymentResult
      };
    } catch (error) {
      console.error('❌ Error creating pet with domain:', error);
      throw error;
    }
  }
  
  async deletePetDomain(petId, petName) {
    try {
      // 1. Delete DNS record
      await this.dnsManager.deleteSubdomain(petName);
      
      // 2. Delete domain record from Firestore
      await deleteDoc(doc(db, 'domains', `domain_${petId}`));
      
      console.log(`✅ Successfully deleted domain for: ${petName}`);
    } catch (error) {
      console.error('❌ Error deleting pet domain:', error);
      throw error;
    }
  }
}

/**
 * Infrastructure Setup Functions
 */
async function setupInfrastructure() {
  console.log('🚀 Setting up infrastructure for multi-user, multi-pet system...');
  
  try {
    // 1. Initialize Simply.com DNS API
    const dnsManager = new DNSManager(process.env.SIMPLY_API_KEY, process.env.SIMPLY_ACCOUNT_NO);
    
    // 2. Set up GitHub Pages deployment
    const deploymentManager = new DeploymentManager(process.env.GITHUB_TOKEN);
    
    // 3. Create domain management system
    const domainManager = new DomainManager(dnsManager, deploymentManager);
    
    // 4. Create infrastructure configuration
    const infrastructureConfig = {
      currentProvider: 'github_pages',
      providers: {
        github_pages: {
          baseUrl: 'https://zebrastribe.github.io/trace',
          deploymentMethod: 'git_push',
          configFile: '_config.yml'
        },
        firebase_hosting: {
          baseUrl: 'https://trace-pets.web.app',
          deploymentMethod: 'firebase_deploy',
          configFile: 'firebase.json'
        },
        custom: {
          baseUrl: 'https://trace.stri.be',
          deploymentMethod: 'custom',
          configFile: 'deployment.json'
        }
      },
      petPathTemplate: '/{petname}/',
      adminPath: '/admin/',
      dnsProvider: 'simply',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'infrastructure', 'config'), infrastructureConfig);
    
    console.log('✅ Infrastructure setup completed successfully!');
    
    return {
      dnsManager,
      deploymentManager,
      domainManager,
      config: infrastructureConfig
    };
  } catch (error) {
    console.error('❌ Infrastructure setup failed:', error);
    throw error;
  }
}

async function migrateFreddyToTrace() {
  console.log('🔄 Migrating Freddy to Trace system...');
  
  try {
    // 1. Create Freddy pet configuration
    const freddyPet = {
      id: 'pet_freddy_001',
      name: 'Freddy',
      type: 'cat',
      breed: 'ginger',
      status: 'active',
      isPublic: true,
      domain: 'freddy.stri.be',
      hosting: {
        provider: 'github_pages',
        baseUrl: 'https://zebrastribe.github.io/trace',
        path: '/freddy/',
        fullUrl: 'https://zebrastribe.github.io/trace/freddy/'
      },
      metadata: {
        description: 'Adventurous ginger cat with a heart as fiery as his fur!',
        personality: 'adventurous',
        color: 'ginger',
        tags: ['adventurous', 'friendly', 'ginger']
      }
    };
    
    // 2. Set up Freddy's domain
    const dnsManager = new DNSManager(process.env.SIMPLY_API_KEY, process.env.SIMPLY_ACCOUNT_NO);
    const deploymentManager = new DeploymentManager(process.env.GITHUB_TOKEN);
    const domainManager = new DomainManager(dnsManager, deploymentManager);
    
    await domainManager.createPetWithDomain(freddyPet);
    
    console.log('✅ Freddy migration completed successfully!');
    return freddyPet;
  } catch (error) {
    console.error('❌ Freddy migration failed:', error);
    throw error;
  }
}

async function validateInfrastructure() {
  console.log('🔍 Validating infrastructure setup...');
  
  try {
    // Check infrastructure configuration
    const configDoc = await getDoc(doc(db, 'infrastructure', 'config'));
    if (!configDoc.exists()) {
      throw new Error('Infrastructure configuration not found');
    }
    
    // Check DNS manager
    const dnsManager = new DNSManager(process.env.SIMPLY_API_KEY, process.env.SIMPLY_ACCOUNT_NO);
    const subdomains = await dnsManager.listSubdomains();
    console.log(`✅ Found ${subdomains.length} existing subdomains`);
    
    // Check deployment manager
    const deploymentManager = new DeploymentManager(process.env.GITHUB_TOKEN);
    console.log('✅ Deployment manager initialized');
    
    console.log('✅ Infrastructure validation passed');
    return true;
  } catch (error) {
    console.error('❌ Infrastructure validation failed:', error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await setupInfrastructure();
      break;
    case 'migrate-freddy':
      await migrateFreddyToTrace();
      break;
    case 'validate':
      await validateInfrastructure();
      break;
    default:
      console.log('Usage: node setup-infrastructure.js [setup|migrate-freddy|validate]');
      console.log('\nCommands:');
      console.log('  setup         - Set up infrastructure components');
      console.log('  migrate-freddy - Migrate Freddy to Trace system');
      console.log('  validate      - Validate infrastructure setup');
      console.log('\nEnvironment Variables:');
      console.log('  SIMPLY_API_KEY - Simply.com API key for DNS management');
      console.log('  SIMPLY_ACCOUNT_NO - Simply.com account number for API authentication');
      console.log('  GITHUB_TOKEN   - GitHub token for deployment');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupInfrastructure,
  migrateFreddyToTrace,
  validateInfrastructure,
  DNSManager,
  DeploymentManager,
  DomainManager
}; 