/**
 * GitHub Pages Hosting Provider
 * 
 * @class GitHubPagesProvider
 * @description Manages GitHub Pages deployment for multi-pet system
 */

export class GitHubPagesProvider {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://zebrastribe.github.io/trace';
    this.repoOwner = config.repoOwner || 'zebrastribe';
    this.repoName = config.repoName || 'trace';
    this.deploymentMethod = config.deploymentMethod || 'git_push';
    this.configFile = config.configFile || '_config.yml';
  }

  /**
   * Create pet hosting configuration
   */
  async createPetHosting(petName, petConfig) {
    return {
      provider: 'github_pages',
      baseUrl: this.baseUrl,
      path: `/${petName.toLowerCase()}/`,
      fullUrl: `${this.baseUrl}/${petName.toLowerCase()}/`,
      config: {
        repoOwner: this.repoOwner,
        repoName: this.repoName,
        petPath: `pets/${petName}`,
        jekyllConfig: this.generateJekyllConfig(petName, petConfig)
      }
    };
  }

  /**
   * Get pet URL
   */
  getPetUrl(petName) {
    return `${this.baseUrl}/${petName.toLowerCase()}/`;
  }

  /**
   * Deploy pet to GitHub Pages
   */
  async deployPet(petName, petConfig) {
    try {
      console.log(`🚀 Deploying ${petName} to GitHub Pages...`);
      
      // 1. Create pet-specific directory structure
      const petPath = `pets/${petName}`;
      await this.createPetDirectory(petPath, petName, petConfig);
      
      // 2. Generate pet-specific files
      await this.generatePetFiles(petPath, petName, petConfig);
      
      // 3. Update Jekyll configuration
      await this.updateJekyllConfig(petName, petConfig);
      
      // 4. Commit and push changes
      await this.commitAndPush(petName);
      
      console.log(`✅ Successfully deployed ${petName} to GitHub Pages`);
      return {
        success: true,
        url: this.getPetUrl(petName),
        deploymentTime: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to deploy ${petName}:`, error);
      throw error;
    }
  }

  /**
   * Create pet directory structure
   */
  async createPetDirectory(petPath, petName, petConfig) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Create pet directory
    await fs.mkdir(petPath, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['assets', 'css', 'js', 'img'];
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(petPath, subdir), { recursive: true });
    }
    
    console.log(`📁 Created directory structure for ${petName}`);
  }

  /**
   * Generate pet-specific files
   */
  async generatePetFiles(petPath, petName, petConfig) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Generate index.html
    const indexHtml = this.generateIndexHtml(petName, petConfig);
    await fs.writeFile(path.join(petPath, 'index.html'), indexHtml);
    
    // Generate config.json
    const configJson = JSON.stringify(petConfig, null, 2);
    await fs.writeFile(path.join(petPath, 'config.json'), configJson);
    
    // Generate README.md
    const readmeMd = this.generateReadmeMd(petName, petConfig);
    await fs.writeFile(path.join(petPath, 'README.md'), readmeMd);
    
    console.log(`📄 Generated files for ${petName}`);
  }

  /**
   * Generate pet-specific index.html
   */
  generateIndexHtml(petName, petConfig) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${petConfig.name} - Pet Tracker</title>
    <meta name="description" content="${petConfig.metadata?.description || `Track ${petConfig.name}'s location and status`}">
    <link rel="stylesheet" href="/css/main.css">
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico">
    <meta property="og:title" content="${petConfig.name} - Pet Tracker">
    <meta property="og:description" content="${petConfig.metadata?.description || `Track ${petConfig.name}'s location and status`}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${this.getPetUrl(petName)}">
</head>
<body>
    <div id="app">
        <header class="pet-header">
            <div class="container">
                <h1 class="pet-name">${petConfig.name}</h1>
                <p class="pet-description">${petConfig.metadata?.description || 'Pet tracking page'}</p>
                <div class="pet-status" id="pet-status">
                    <span class="status-indicator" id="status-indicator">Loading...</span>
                    <span class="last-seen" id="last-seen"></span>
                </div>
            </div>
        </header>
        
        <main class="pet-main">
            <div class="container">
                <section class="pet-info">
                    <h2>About ${petConfig.name}</h2>
                    <div class="pet-details">
                        <div class="detail-item">
                            <strong>Type:</strong> ${petConfig.type}
                        </div>
                        <div class="detail-item">
                            <strong>Breed:</strong> ${petConfig.breed}
                        </div>
                        <div class="detail-item">
                            <strong>Status:</strong> <span id="pet-status-text">Loading...</span>
                        </div>
                        ${petConfig.metadata?.personality ? `
                        <div class="detail-item">
                            <strong>Personality:</strong> ${petConfig.metadata.personality}
                        </div>
                        ` : ''}
                    </div>
                </section>
                
                <section class="checkin-section">
                    <h2>Check-in ${petConfig.name}</h2>
                    <div class="checkin-form">
                        <form id="location-form">
                            <div class="form-group">
                                <label for="user-name">Your Name (optional):</label>
                                <input type="text" id="user-name" name="name" placeholder="Enter your name">
                            </div>
                            <button type="submit" id="checkin-btn" class="btn btn-primary">
                                📍 Check-in Location
                            </button>
                        </form>
                        <div id="checkin-status" class="checkin-status"></div>
                    </div>
                </section>
                
                <section class="map-section">
                    <h2>Last Known Location</h2>
                    <div id="map" class="map-container"></div>
                    <div id="location-info" class="location-info"></div>
                </section>
                
                <section class="recent-checkins">
                    <h2>Recent Check-ins</h2>
                    <div id="recent-checkins" class="checkins-list"></div>
                </section>
            </div>
        </main>
        
        <footer class="pet-footer">
            <div class="container">
                <p>&copy; 2024 Pet Tracker. ${petConfig.name} is being tracked with love.</p>
            </div>
        </footer>
    </div>
    
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
        import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
        
        // Initialize Firebase with your config
        const firebaseConfig = {
            // Your Firebase config here
        };
        
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Pet-specific configuration
        const petId = '${petConfig.id}';
        const petName = '${petConfig.name}';
        const petDomain = '${petConfig.domain}';
        
        // Load pet status
        async function loadPetStatus() {
            try {
                const statusDoc = await getDoc(doc(db, 'pet_status', petId));
                if (statusDoc.exists()) {
                    const status = statusDoc.data();
                    document.getElementById('pet-status-text').textContent = status.status;
                    document.getElementById('status-indicator').textContent = status.status;
                    document.getElementById('status-indicator').className = \`status-indicator \${status.status.toLowerCase()}\`;
                    
                    if (status.lastSeen) {
                        const lastSeen = status.lastSeen.toDate();
                        const timeAgo = getTimeAgo(lastSeen);
                        document.getElementById('last-seen').textContent = \`Last seen: \${timeAgo}\`;
                    }
                }
            } catch (error) {
                console.error('Error loading pet status:', error);
            }
        }
        
        // Load recent check-ins
        async function loadRecentCheckins() {
            try {
                const checkinsQuery = query(
                    collection(db, 'clicks'),
                    orderBy('timestamp', 'desc'),
                    limit(10)
                );
                
                const snapshot = await getDocs(checkinsQuery);
                const checkins = [];
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.petId === petId) {
                        checkins.push({ id: doc.id, ...data });
                    }
                });
                
                displayRecentCheckins(checkins);
            } catch (error) {
                console.error('Error loading recent check-ins:', error);
            }
        }
        
        // Display recent check-ins
        function displayRecentCheckins(checkins) {
            const container = document.getElementById('recent-checkins');
            
            if (checkins.length === 0) {
                container.innerHTML = '<p>No recent check-ins yet.</p>';
                return;
            }
            
            const checkinsHtml = checkins.map(checkin => {
                const time = checkin.timestamp ? checkin.timestamp.toDate().toLocaleString() : 'Unknown time';
                return \`
                    <div class="checkin-item">
                        <div class="checkin-info">
                            <strong>\${checkin.name || 'Anonymous'}</strong>
                            <span class="checkin-time">\${time}</span>
                        </div>
                        <div class="checkin-location">
                            📍 \${checkin.latitude?.toFixed(6)}, \${checkin.longitude?.toFixed(6)}
                        </div>
                    </div>
                \`;
            }).join('');
            
            container.innerHTML = checkinsHtml;
        }
        
        // Handle check-in form submission
        document.getElementById('location-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const checkinBtn = document.getElementById('checkin-btn');
            const statusDiv = document.getElementById('checkin-status');
            
            checkinBtn.disabled = true;
            checkinBtn.textContent = 'Checking in...';
            statusDiv.innerHTML = '';
            
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    try {
                        const userName = document.getElementById('user-name').value || 'Anonymous User';
                        
                        const checkinData = {
                            petId: petId,
                            name: userName,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            timestamp: serverTimestamp(),
                            domain: petDomain,
                            metadata: {
                                accuracy: position.coords.accuracy,
                                altitude: position.coords.altitude,
                                speed: position.coords.speed,
                                heading: position.coords.heading
                            }
                        };
                        
                        await setDoc(doc(db, 'clicks', \`checkin_\${Date.now()}\`), checkinData);
                        
                        // Update pet status
                        await setDoc(doc(db, 'pet_status', petId), {
                            status: 'OK',
                            lastSeen: serverTimestamp(),
                            lastLocation: {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            },
                            updatedAt: serverTimestamp(),
                            updatedBy: userName
                        });
                        
                        statusDiv.innerHTML = '<div class="success">✅ Check-in successful! Thank you for helping track ' + petName + '.</div>';
                        
                        // Reload data
                        loadPetStatus();
                        loadRecentCheckins();
                        
                    } catch (error) {
                        console.error('Error during check-in:', error);
                        statusDiv.innerHTML = '<div class="error">❌ Check-in failed. Please try again.</div>';
                    } finally {
                        checkinBtn.disabled = false;
                        checkinBtn.textContent = '📍 Check-in Location';
                    }
                }, (error) => {
                    console.error('Geolocation error:', error);
                    statusDiv.innerHTML = '<div class="error">❌ Unable to get your location. Please enable location services.</div>';
                    checkinBtn.disabled = false;
                    checkinBtn.textContent = '📍 Check-in Location';
                });
            } else {
                statusDiv.innerHTML = '<div class="error">❌ Geolocation is not supported by this browser.</div>';
                checkinBtn.disabled = false;
                checkinBtn.textContent = '📍 Check-in Location';
            }
        });
        
        // Helper function to get time ago
        function getTimeAgo(date) {
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' minutes ago';
            if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' hours ago';
            return Math.floor(diffInSeconds / 86400) + ' days ago';
        }
        
        // Initialize
        loadPetStatus();
        loadRecentCheckins();
        
        // Refresh data every 30 seconds
        setInterval(() => {
            loadPetStatus();
            loadRecentCheckins();
        }, 30000);
    </script>
</body>
</html>`;
  }

  /**
   * Generate README for pet
   */
  generateReadmeMd(petName, petConfig) {
    return `# ${petConfig.name} - Pet Tracker

This is the tracking page for ${petConfig.name}, a ${petConfig.breed} ${petConfig.type}.

## About ${petConfig.name}

${petConfig.metadata?.description || 'No description available.'}

### Details
- **Type**: ${petConfig.type}
- **Breed**: ${petConfig.breed}
- **Status**: ${petConfig.status}
- **Domain**: ${petConfig.domain}

### Personality
${petConfig.metadata?.personality || 'No personality information available.'}

## How to Help

If you see ${petConfig.name}, please use the check-in form on this page to report their location. This helps ${petConfig.name}'s family know they're safe.

## Contact

If you have any questions about ${petConfig.name}, please contact the pet's owner through the main tracking system.

---

*This page is automatically generated by the Pet Tracker system.*`;
  }

  /**
   * Generate Jekyll configuration
   */
  generateJekyllConfig(petName, petConfig) {
    return {
      title: `${petConfig.name} - Pet Tracker`,
      description: petConfig.metadata?.description || `Track ${petConfig.name}'s location and status`,
      baseurl: `/${petName.toLowerCase()}`,
      url: this.getPetUrl(petName),
      pet: {
        name: petConfig.name,
        type: petConfig.type,
        breed: petConfig.breed,
        status: petConfig.status,
        domain: petConfig.domain,
        metadata: petConfig.metadata
      }
    };
  }

  /**
   * Update main Jekyll configuration
   */
  async updateJekyllConfig(petName, petConfig) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const configPath = path.join(process.cwd(), '_config.yml');
      let config = '';
      
      try {
        config = await fs.readFile(configPath, 'utf8');
      } catch (error) {
        // Config file doesn't exist, create default
        config = this.generateDefaultJekyllConfig();
      }
      
      // Add pet to configuration
      const petConfigYaml = this.generatePetConfigYaml(petName, petConfig);
      config += '\n' + petConfigYaml;
      
      await fs.writeFile(configPath, config);
      console.log(`📝 Updated Jekyll configuration for ${petName}`);
    } catch (error) {
      console.error('Error updating Jekyll config:', error);
    }
  }

  /**
   * Generate default Jekyll configuration
   */
  generateDefaultJekyllConfig() {
    return `# Pet Tracker - Multi-User, Multi-Pet System
title: Pet Tracker
description: Track your pets with love and care
baseurl: ""
url: "https://zebrastribe.github.io/trace"

# Build settings
markdown: kramdown
theme: jekyll-theme-cayman
plugins:
  - jekyll-feed

# Pet configurations
pets:`;
  }

  /**
   * Generate pet configuration YAML
   */
  generatePetConfigYaml(petName, petConfig) {
    return `
  ${petName.toLowerCase()}:
    name: ${petConfig.name}
    type: ${petConfig.type}
    breed: ${petConfig.breed}
    status: ${petConfig.status}
    domain: ${petConfig.domain}
    path: /${petName.toLowerCase()}/
    metadata:
      description: "${petConfig.metadata?.description || ''}"
      personality: "${petConfig.metadata?.personality || ''}"
      color: "${petConfig.metadata?.color || ''}"`;
  }

  /**
   * Commit and push changes
   */
  async commitAndPush(petName) {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      // Add all changes
      await execAsync('git add .');
      
      // Commit changes
      await execAsync(`git commit -m "feat: Deploy ${petName} to GitHub Pages"`);
      
      // Push to GitHub
      await execAsync('git push origin main');
      
      console.log(`📤 Pushed changes for ${petName} to GitHub`);
    } catch (error) {
      console.error('Error committing and pushing:', error);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(petName) {
    // In a real implementation, you would check GitHub Pages deployment status
    // For now, we'll return a mock status
    return {
      status: 'deployed',
      url: this.getPetUrl(petName),
      lastDeployment: new Date().toISOString(),
      provider: 'github_pages'
    };
  }
}

export default GitHubPagesProvider; 