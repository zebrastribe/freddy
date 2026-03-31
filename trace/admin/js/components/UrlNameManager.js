import { mythologyNames } from '../mythology-names.js';

export class UrlNameManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.mythologyNames = this.flattenMythologyNames();
        this.usedNames = new Set();
    }

    // Flatten the nested mythology names into a single array
    flattenMythologyNames() {
        const names = [];
        for (const category in mythologyNames) {
            if (typeof mythologyNames[category] === 'object') {
                for (const subcategory in mythologyNames[category]) {
                    if (Array.isArray(mythologyNames[category][subcategory])) {
                        names.push(...mythologyNames[category][subcategory]);
                    }
                }
            } else if (Array.isArray(mythologyNames[category])) {
                names.push(...mythologyNames[category]);
            }
        }
        return names;
    }

    async init() {
        console.log('🔗 Initializing URL Name Manager...');
        await this.loadUsedNames();
    }

    // Load all used URL names from Firestore
    async loadUsedNames() {
        try {
            const firebase = this.adminApp.getService('firebase');
            const urlNamesSnapshot = await firebase.getCollection('url_names');
            
            this.usedNames.clear();
            urlNamesSnapshot.forEach(doc => {
                this.usedNames.add(doc.data().urlName);
            });
            
            console.log(`[UrlNameManager] Loaded ${this.usedNames.size} used URL names`);
        } catch (error) {
            console.error('[UrlNameManager] Error loading used names:', error);
        }
    }

    // Generate a unique URL name
    async generateUniqueUrlName() {
        // Try base mythology names first
        for (const name of this.mythologyNames) {
            if (!this.usedNames.has(name)) {
                return name;
            }
        }

        // If all mythology names are used, generate with numbers
        let counter = 2;
        while (true) {
            const randomName = this.mythologyNames[Math.floor(Math.random() * this.mythologyNames.length)];
            const numberedName = `${randomName}-${counter}`;
            
            if (!this.usedNames.has(numberedName)) {
                return numberedName;
            }
            counter++;
        }
    }

    // Check if a URL name is available
    async isUrlNameAvailable(urlName) {
        await this.loadUsedNames(); // Refresh the list
        return !this.usedNames.has(urlName);
    }

    // Create a new URL name entry in Firestore
    async createUrlName(userId, urlName) {
        try {
            const firebase = this.adminApp.getService('firebase');
            
            // Add to url_names collection
            await firebase.setDocument('url_names', urlName, {
                urlName: urlName,
                userId: userId,
                createdAt: new Date().toISOString(),
                isActive: true
            });

            // Update user document with URL name
            await firebase.updateDocument('users', userId, {
                urlName: urlName
            });

            // Add to local cache
            this.usedNames.add(urlName);
            
            console.log(`[UrlNameManager] Created URL name: ${urlName} for user: ${userId}`);
            return urlName;
        } catch (error) {
            console.error('[UrlNameManager] Error creating URL name:', error);
            throw error;
        }
    }

    // Get URL name for a user
    async getUrlNameForUser(userId) {
        try {
            const firebase = this.adminApp.getService('firebase');
            const userDoc = await firebase.getDocument('users', userId);
            
            if (userDoc && userDoc.exists()) {
                return userDoc.data().urlName || null;
            }
            return null;
        } catch (error) {
            console.error('[UrlNameManager] Error getting URL name for user:', error);
            return null;
        }
    }

    // Get user ID for a URL name
    async getUserIdForUrlName(urlName) {
        try {
            const firebase = this.adminApp.getService('firebase');
            const urlNameDoc = await firebase.getDocument('url_names', urlName);
            
            if (urlNameDoc && urlNameDoc.exists()) {
                return urlNameDoc.data().userId || null;
            }
            return null;
        } catch (error) {
            console.error('[UrlNameManager] Error getting user ID for URL name:', error);
            return null;
        }
    }

    // Delete a URL name (when user is deleted)
    async deleteUrlName(urlName) {
        try {
            const firebase = this.adminApp.getService('firebase');
            
            // Remove from url_names collection
            await firebase.deleteDocument('url_names', urlName);
            
            // Remove from local cache
            this.usedNames.delete(urlName);
            
            console.log(`[UrlNameManager] Deleted URL name: ${urlName}`);
        } catch (error) {
            console.error('[UrlNameManager] Error deleting URL name:', error);
            throw error;
        }
    }

    // Get statistics about URL names
    async getUrlNameStats() {
        try {
            const firebase = this.adminApp.getService('firebase');
            const urlNamesSnapshot = await firebase.getCollection('url_names');
            
            const stats = {
                totalUsed: urlNamesSnapshot.size,
                totalAvailable: this.mythologyNames.length,
                usedNames: [],
                availableNames: []
            };

            // Get used names
            urlNamesSnapshot.forEach(doc => {
                stats.usedNames.push(doc.data().urlName);
            });

            // Get available names
            stats.availableNames = this.mythologyNames.filter(name => 
                !stats.usedNames.includes(name)
            );

            return stats;
        } catch (error) {
            console.error('[UrlNameManager] Error getting URL name stats:', error);
            return null;
        }
    }

    // Generate a preview of available names
    getAvailableNamesPreview(count = 10) {
        const available = this.mythologyNames.filter(name => 
            !this.usedNames.has(name)
        );
        return available.slice(0, count);
    }
} 