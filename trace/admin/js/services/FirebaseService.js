// Firebase Service
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, connectAuthEmulator, createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where, orderBy, limit, addDoc, updateDoc, connectFirestoreEmulator, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { logger } from './logger.js';

export class FirebaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.authStateCallback = null;
        this.isInitialized = false;
        this.currentUser = null;
    }

    async init() {
        try {
            logger.info('admin_firebase_init_start');
            
            // Firebase configuration
            const firebaseConfig = {
                apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
                authDomain: "tracker-6a648.firebaseapp.com",
                projectId: "tracker-6a648",
                storageBucket: "tracker-6a648.appspot.com",
                messagingSenderId: "789878332530",
                appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
                measurementId: "G-XMHHKFJ9QW"
            };
            
            // Initialize Firebase
            this.app = initializeApp(firebaseConfig);
            
            // Initialize Auth
            this.auth = getAuth(this.app);
            
            // Initialize Firestore
            this.db = getFirestore(this.app);
            
            // Connect to emulators
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('🔗 Connecting to Firebase emulators...');
                try {
                connectFirestoreEmulator(this.db, 'localhost', 8180);
                    connectAuthEmulator(this.auth, 'http://localhost:9099', { disableWarnings: true });
                logger.info('admin_firebase_emulator_connected');
                } catch (error) {
                    console.warn('⚠️ Emulator connection warning:', error);
                    // Continue anyway as emulators might already be connected
                }
            }
            
            // Set up auth state listener
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                if (this.authStateCallback) {
                    this.authStateCallback(user);
                }
                console.log('Auth state changed:', user ? user.email : 'No user');
            });
            
            this.isInitialized = true;
            
            logger.info('admin_firebase_init_success');
        } catch (error) {
            logger.error('admin_firebase_init_failed', { message: error.message });
            throw error;
        }
    }

    // Authentication methods
    async signInWithEmailAndPassword(email, password) {
        logger.info('admin_signin_attempt', { email });
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            logger.info('admin_signin_success', { email: userCredential.user.email });
            return userCredential;
        } catch (error) {
            logger.error('admin_signin_failed', { message: error.message });
            throw error;
        }
    }

    async signOut() {
        console.log('🚪 Signing out');
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            await signOut(this.auth);
            console.log('✅ Sign out successful');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            throw error;
        }
    }

    onAuthStateChanged(callback) {
        this.authStateCallback = callback;
        // Call immediately with current state
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Firestore methods
    async getCollection(collectionName, options = {}) {
        let q = collection(this.db, collectionName);
        
        if (options.where) {
            q = query(q, where(options.where.field, options.where.operator, options.where.value));
        }
        
        if (options.orderBy) {
            q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'));
        }
        
        if (options.limit) {
            q = query(q, limit(options.limit));
        }
        
        return await getDocs(q);
    }

    async getDoc(collectionName, docId) {
        const docRef = doc(this.db, collectionName, docId);
        return await getDoc(docRef);
    }

    async getDocument(collectionName, docId) {
        const docRef = doc(this.db, collectionName, docId);
        return await getDoc(docRef);
    }

    async addDocument(collectionName, data) {
        console.log(`📝 Adding document to ${collectionName}:`, data);
        const docRef = collection(this.db, collectionName);
        return await addDoc(docRef, data);
    }

    async setDocument(collectionName, docId, data) {
        const docRef = doc(this.db, collectionName, docId);
        return await setDoc(docRef, data);
    }

    async updateDocument(collectionPath, docId, data) {
        // Support subcollections by splitting the path
        const pathSegments = collectionPath.split('/');
        const docRef = doc(this.db, ...pathSegments, docId);
        return await updateDoc(docRef, data);
    }

    async deleteDocument(collectionPath, docId) {
        console.log(`[FirebaseService] 🗑️ Deleting document ${docId} from ${collectionPath}`);
        // Support subcollections by splitting the path
        const pathSegments = collectionPath.split('/');
        const docRef = doc(this.db, ...pathSegments, docId);
        try {
            const result = await deleteDoc(docRef);
            console.log('[FirebaseService] Document deleted:', docRef.path);
            return result;
        } catch (error) {
            console.error('[FirebaseService] Error deleting document:', error, 'Path:', docRef.path);
            throw error;
        }
    }

    // Admin-specific methods
    async checkAdminRole(userId) {
        try {
            const userDoc = await this.getDoc('users', userId);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role || 'user';
                return role === 'admin' || role === 'superadmin';
            }
            return false;
        } catch (error) {
            console.error('Error checking admin role:', error);
            return false;
        }
    }

    async getUserRole(userId) {
        try {
            const userDoc = await this.getDoc('users', userId);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return userData.role || 'user';
            }
            return 'user';
        } catch (error) {
            console.error('Error getting user role:', error);
            return 'user';
        }
    }

    // Check if current user is admin
    async isCurrentUserAdmin() {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            const userDoc = await this.getDoc('users', this.currentUser.uid);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role || 'user';
                return role === 'admin' || role === 'superadmin';
            }
            return false;
        } catch (error) {
            console.error('Error checking if current user is admin:', error);
            return false;
        }
    }

    // Statistics methods
    async getStatistics() {
        try {
            // Get all pets from user subcollections, users, checkins, and devices
            const [allPets, usersSnapshot, checkinsSnapshot, devicesSnapshot] = await Promise.all([
                this.getPets(), // This now gets pets from user subcollections
                this.getCollection('users'),
                this.getCollection('clicks'),
                this.getCollection('fcm_tokens')
            ]);

            const missingPets = allPets.filter(pet => pet.status === 'missing');

            return {
                totalPets: allPets.length,
                totalUsers: usersSnapshot.size,
                totalCheckins: checkinsSnapshot.size,
                linkedDevices: devicesSnapshot.size,
                missingPets: missingPets.length
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            throw error;
        }
    }

    // Device management methods
    async getDeviceTokens(petId = null) {
        try {
            let q = collection(this.db, 'fcm_tokens');
            
            if (petId) {
                q = query(q, where('petId', '==', petId));
            }
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting device tokens:', error);
            throw error;
        }
    }

    async addDeviceToken(tokenData) {
        try {
            return await this.addDocument('fcm_tokens', tokenData);
        } catch (error) {
            console.error('Error adding device token:', error);
            throw error;
        }
    }

    async removeDeviceToken(tokenId) {
        try {
            return await this.deleteDocument('fcm_tokens', tokenId);
        } catch (error) {
            console.error('Error removing device token:', error);
            throw error;
        }
    }

    // Pet management methods
    async getPets() {
        try {
            // Get all users first
            const usersSnapshot = await this.getCollection('users');
            const allPets = [];
            
            // For each user, get their pets from the subcollection
            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();
                
                try {
                    const petsRef = collection(this.db, 'users', userId, 'pets');
                    const petsSnapshot = await getDocs(petsRef);
                    
                    petsSnapshot.docs.forEach(petDoc => {
                        allPets.push({
                            id: petDoc.id,
                            userId: userId,
                            userDisplayName: userData.displayName || userData.email,
                            userUrlName: userData.urlName,
                            ...petDoc.data()
                        });
                    });
                } catch (error) {
                    console.warn(`Could not fetch pets for user ${userId}:`, error);
                    // Continue with other users
                }
            }
            
            console.log(`✅ Fetched ${allPets.length} pets from user subcollections`);
            return allPets;
        } catch (error) {
            console.error('Error getting pets:', error);
            throw error;
        }
    }

    async addPet(petData) {
        try {
            // Create pet in the correct subcollection: users/{userId}/pets
            const { userId, ...petFields } = petData;
            if (!userId) {
                throw new Error('userId is required to create a pet');
            }
            
            const petsRef = collection(this.db, 'users', userId, 'pets');
            const docRef = await addDoc(petsRef, {
                ...petFields,
                createdAt: new Date()
            });
            
            console.log(`✅ Pet created in users/${userId}/pets/${docRef.id}`);
            return docRef;
        } catch (error) {
            console.error('Error adding pet:', error);
            throw error;
        }
    }

    async updatePet(petId, petData) {
        try {
            // For admin panel, we need to find which user owns this pet
            // This is a bit inefficient but necessary for the admin interface
            const allPets = await this.getPets();
            const pet = allPets.find(p => p.id === petId);
            
            if (!pet) {
                throw new Error(`Pet with ID ${petId} not found`);
            }
            
            const collectionPath = `users/${pet.userId}/pets`;
            return await this.updateDocument(collectionPath, petId, {
                ...petData,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating pet:', error);
            throw error;
        }
    }

    async deletePet(petId) {
        try {
            console.log('[FirebaseService] Attempting to delete pet:', petId);
            // For admin panel, we need to find which user owns this pet
            const allPets = await this.getPets();
            const pet = allPets.find(p => p.id === petId);
            
            if (!pet) {
                throw new Error(`Pet with ID ${petId} not found`);
            }
            
            const collectionPath = `users/${pet.userId}/pets`;
            console.log('[FirebaseService] Deleting from path:', collectionPath, 'petId:', petId);
            const result = await this.deleteDocument(collectionPath, petId);
            console.log('[FirebaseService] Delete result:', result);
            return result;
        } catch (error) {
            console.error('[FirebaseService] Error deleting pet:', error);
            throw error;
        }
    }

    // User management methods
    async getUsers() {
        try {
            const snapshot = await this.getCollection('users');
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            const docRef = doc(this.db, 'users', userId);
            return await setDoc(docRef, { ...userData, updatedAt: new Date() }, { merge: true });
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Check-in methods
    async getCheckins(options = {}) {
        try {
            const snapshot = await this.getCollection('clicks', {
                orderBy: 'timestamp',
                orderDirection: 'desc',
                limit: options.limit || 50,
                ...options
            });
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting check-ins:', error);
            throw error;
        }
    }

    // Utility methods
    getTimestamp() {
        return new Date();
    }

    formatTimestamp(timestamp) {
        if (timestamp?.toDate) {
            return timestamp.toDate();
        }
        return timestamp;
    }

    timestamp() {
        return new Date();
    }

    serverTimestamp() {
        return new Date();
    }

    batch() {
        return {
            set: (docRef, data) => console.log('Batch set:', docRef, data),
            update: (docRef, data) => console.log('Batch update:', docRef, data),
            delete: (docRef) => console.log('Batch delete:', docRef),
            commit: async () => console.log('Batch committed')
        };
    }

    async createUser({ displayName, email, password, role, phone }) {
        if (!this.auth || !this.db) throw new Error('Firebase not initialized');
        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // 2. Update profile with display name
            if (displayName) {
                await updateProfile(user, { displayName });
            }
            
            // 3. Generate unique URL name
            const urlNameManager = this.adminApp.getService('urlNameManager');
            const urlName = await urlNameManager.generateUniqueUrlName();
            
            // 4. Add user document to Firestore
            const userData = {
                id: user.uid,
                email: user.email,
                displayName: displayName || user.displayName || email.split('@')[0],
                role: role || 'user',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                urlName: urlName
            };
            if (phone) userData.phone = phone;
            
            await this.setDocument('users', user.uid, userData);
            
            // 5. Create URL name entry
            await urlNameManager.createUrlName(user.uid, urlName);
            
            console.log(`[FirebaseService] Created user: ${user.uid} with URL name: ${urlName}`);
            return { ...userData, urlName };
        } catch (error) {
            console.error('[FirebaseService] Error creating user:', error);
            throw error;
        }
    }

    async checkUserPermission(userId, feature, permission) {
        try {
            // Get user's role
            const userDoc = await this.getDocument('users', userId);
            if (!userDoc.exists()) {
                return false;
            }
            
            const userData = userDoc.data();
            const userRole = userData.role || 'user';
            
            // Get permissions matrix
            const permissionsDoc = await this.getDocument('system_config', 'permissions');
            if (!permissionsDoc.exists()) {
                // If no permissions matrix exists, use default role-based logic
                return this.checkDefaultPermission(userRole, feature, permission);
            }
            
            const permissions = permissionsDoc.data();
            const rolePermissions = permissions[userRole];
            
            if (!rolePermissions || !rolePermissions[feature]) {
                return false;
            }
            
            return rolePermissions[feature][permission] === true;
        } catch (error) {
            console.error('Error checking user permission:', error);
            return false;
        }
    }

    checkDefaultPermission(role, feature, permission) {
        // Default permission logic as fallback
        const defaultPermissions = {
            super_admin: {
                overview: { view: true, create: false, edit: false, delete: false },
                users: { view: true, create: true, edit: true, delete: true, all: true },
                pets: { view: true, create: true, edit: true, delete: true, all: true },
                notifications: { view: true, create: true, edit: true, delete: true, all: true },
                profile: { view: true, create: false, edit: true, delete: false, all: true }
            },
            admin: {
                overview: { view: true, create: false, edit: false, delete: false },
                users: { view: true, create: true, edit: true, delete: false, all: true },
                pets: { view: true, create: true, edit: true, delete: true, all: true },
                notifications: { view: true, create: true, edit: true, delete: false, all: true },
                profile: { view: true, create: false, edit: true, delete: false, all: false }
            },
            pet_admin: {
                overview: { view: true, create: false, edit: false, delete: false },
                users: { view: false, create: false, edit: false, delete: false, all: false },
                pets: { view: true, create: true, edit: true, delete: true, all: true },
                notifications: { view: true, create: false, edit: false, delete: false, all: false },
                profile: { view: true, create: false, edit: true, delete: false, all: false }
            },
            user: {
                overview: { view: true, create: false, edit: false, delete: false },
                users: { view: false, create: false, edit: false, delete: false, all: false },
                pets: { view: true, create: true, edit: true, delete: true, all: false, own: true },
                notifications: { view: true, create: false, edit: false, delete: false, all: false, own: true },
                profile: { view: true, create: false, edit: true, delete: false, all: false, own: true }
            },
            guest: {
                overview: { view: false, create: false, edit: false, delete: false },
                users: { view: false, create: false, edit: false, delete: false, all: false },
                pets: { view: true, create: false, edit: false, delete: false, all: false },
                notifications: { view: false, create: false, edit: false, delete: false, all: false },
                profile: { view: false, create: false, edit: false, delete: false, all: false }
            }
        };
        
        const rolePerms = defaultPermissions[role];
        if (!rolePerms || !rolePerms[feature]) {
            return false;
        }
        
        return rolePerms[feature][permission] === true;
    }
} 