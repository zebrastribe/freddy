// Firebase Service
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where, orderBy, limit, addDoc, updateDoc, connectFirestoreEmulator, getDoc } from 'firebase/firestore';
import { logger } from '../../../../shared/lib/logger.js';

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
        const initStart = performance.now();
        logger.info('frontend_admin_firebase_init_start');
        
        try {
            const configStart = performance.now();
            // Firebase configuration for emulator
            const firebaseConfig = {
                apiKey: "demo-api-key",
                authDomain: "demo-project.firebaseapp.com",
                projectId: "tracker-6a648",
                storageBucket: "demo-project.appspot.com",
                messagingSenderId: "123456789",
                appId: "demo-app-id"
            };
            
            const configEnd = performance.now();
            console.log('📋 Firebase config prepared:', { 
                duration: configEnd - configStart,
                timestamp: new Date().toISOString()
            });
            
            // Initialize Firebase
            const appInitStart = performance.now();
            console.log('🔥 Initializing Firebase app...', { timestamp: new Date().toISOString() });
            this.app = initializeApp(firebaseConfig);
            const appInitEnd = performance.now();
            console.log('✅ Firebase app initialized:', { 
                duration: appInitEnd - appInitStart,
                timestamp: new Date().toISOString()
            });
            
            // Initialize Auth
            const authInitStart = performance.now();
            console.log('🔐 Initializing Firebase Auth...', { timestamp: new Date().toISOString() });
            this.auth = getAuth(this.app);
            const authInitEnd = performance.now();
            console.log('✅ Firebase Auth initialized:', { 
                duration: authInitEnd - authInitStart,
                timestamp: new Date().toISOString()
            });
            
            // Initialize Firestore
            const firestoreInitStart = performance.now();
            console.log('📊 Initializing Firestore...', { timestamp: new Date().toISOString() });
            this.db = getFirestore(this.app);
            const firestoreInitEnd = performance.now();
            console.log('✅ Firestore initialized:', { 
                duration: firestoreInitEnd - firestoreInitStart,
                timestamp: new Date().toISOString()
            });
            
            // Connect to emulators
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                const emulatorStart = performance.now();
                console.log('🔗 Connecting to Firebase emulators...', { timestamp: new Date().toISOString() });
                
                const firestoreEmulatorStart = performance.now();
                connectFirestoreEmulator(this.db, 'localhost', 8180);
                const firestoreEmulatorEnd = performance.now();
                console.log('✅ Firestore emulator connected:', { 
                    duration: firestoreEmulatorEnd - firestoreEmulatorStart,
                    timestamp: new Date().toISOString()
                });
                
                const authEmulatorStart = performance.now();
                connectAuthEmulator(this.auth, 'http://localhost:9099');
                const authEmulatorEnd = performance.now();
                console.log('✅ Auth emulator connected:', { 
                    duration: authEmulatorEnd - authEmulatorStart,
                    timestamp: new Date().toISOString()
                });
                
                const emulatorEnd = performance.now();
                logger.info('frontend_admin_firebase_emulator_connected', {
                    durationMs: emulatorEnd - emulatorStart
                });
            }
            
            // Set up auth state listener
            const listenerStart = performance.now();
            console.log('👂 Setting up auth state listener...', { timestamp: new Date().toISOString() });
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                if (this.authStateCallback) {
                    this.authStateCallback(user);
                }
                console.log('Auth state changed:', user ? user.email : 'No user', { timestamp: new Date().toISOString() });
            });
            const listenerEnd = performance.now();
            console.log('✅ Auth state listener setup skipped (handled by AuthManager):', { 
                duration: listenerEnd - listenerStart,
                timestamp: new Date().toISOString()
            });
            
            this.isInitialized = true;
            
            const initEnd = performance.now();
            logger.info('frontend_admin_firebase_init_success', {
                durationMs: initEnd - initStart
            });
        } catch (error) {
            const errorTime = performance.now();
            logger.error('frontend_admin_firebase_init_failed', {
                durationMs: errorTime - initStart,
                message: error.message
            });
            throw error;
        }
    }

    // Authentication methods
    async signInWithEmailAndPassword(email, password) {
        const signInStart = performance.now();
        logger.info('frontend_admin_signin_attempt', { email });
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            const firebaseAuthStart = performance.now();
            console.log('🔥 Calling Firebase signInWithEmailAndPassword...', { timestamp: new Date().toISOString() });
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const firebaseAuthEnd = performance.now();
            console.log('✅ Firebase signInWithEmailAndPassword completed:', { 
                duration: firebaseAuthEnd - firebaseAuthStart,
                timestamp: new Date().toISOString()
            });
            logger.info('frontend_admin_signin_success', {
                email: userCredential.user.email,
                durationMs: firebaseAuthEnd - signInStart
            });
            return userCredential;
        } catch (error) {
            const errorTime = performance.now();
            logger.error('frontend_admin_signin_failed', {
                durationMs: errorTime - signInStart,
                message: error.message
            });
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
        const getDocStart = performance.now();
        console.log(`📋 Getting document ${docId} from ${collectionName}`, { timestamp: new Date().toISOString() });
        
        try {
        const docRef = doc(this.db, collectionName, docId);
            const firestoreGetStart = performance.now();
            const result = await getDoc(docRef);
            const firestoreGetEnd = performance.now();
            
            console.log(`✅ Firestore getDoc completed:`, { 
                collection: collectionName,
                docId: docId,
                exists: result.exists(),
                duration: firestoreGetEnd - firestoreGetStart,
                totalDuration: firestoreGetEnd - getDocStart,
                timestamp: new Date().toISOString()
            });
            
            return result;
        } catch (error) {
            const errorTime = performance.now();
            console.error(`❌ Firestore getDoc failed:`, error, { 
                collection: collectionName,
                docId: docId,
                duration: errorTime - getDocStart,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
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

    async updateDocument(collectionName, docId, data) {
        console.log(`✏️ Updating document ${docId} in ${collectionName}:`, data);
        const docRef = doc(this.db, collectionName, docId);
        return await updateDoc(docRef, data);
    }

    async deleteDocument(collectionName, docId) {
        console.log(`🗑️ Deleting document ${docId} from ${collectionName}`);
        const docRef = doc(this.db, collectionName, docId);
        return await deleteDoc(docRef);
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
        const adminCheckStart = performance.now();
        console.log('🔍 Checking if current user is admin...', { timestamp: new Date().toISOString() });
        
        if (!this.currentUser) {
            console.log('❌ No current user for admin check', { timestamp: new Date().toISOString() });
            return false;
        }
        
        try {
            const userDocStart = performance.now();
            console.log(`📋 Getting user doc for admin check: ${this.currentUser.uid}`, { timestamp: new Date().toISOString() });
            const userDoc = await this.getDoc('users', this.currentUser.uid);
            const userDocEnd = performance.now();
            
            console.log('📋 User doc retrieved for admin check:', { 
                exists: userDoc.exists(),
                duration: userDocEnd - userDocStart,
                timestamp: new Date().toISOString()
            });
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role || 'user';
                const isAdmin = role === 'admin' || role === 'superadmin';
                
                const adminCheckEnd = performance.now();
                console.log('✅ Admin check completed:', { 
                    role: role,
                    isAdmin: isAdmin,
                    totalDuration: adminCheckEnd - adminCheckStart,
                    timestamp: new Date().toISOString()
                });
                
                return isAdmin;
            }
            
            const adminCheckEnd = performance.now();
            console.log('❌ User doc not found for admin check:', { 
                totalDuration: adminCheckEnd - adminCheckStart,
                timestamp: new Date().toISOString()
            });
            return false;
        } catch (error) {
            const errorTime = performance.now();
            console.error('❌ Error checking if current user is admin:', error, { 
                duration: errorTime - adminCheckStart,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    // Statistics methods
    async getStatistics() {
        try {
            // Keep statistics aligned with the canonical users/{uid}/objects model.
            const [allObjects, usersSnapshot, checkinsSnapshot, devicesSnapshot] = await Promise.all([
                this.getObjects(),
                this.getCollection('users'),
                this.getCollection('clicks'),
                this.getCollection('fcm_tokens')
            ]);

            return {
                totalObjects: allObjects.length,
                totalUsers: usersSnapshot.size,
                totalCheckins: checkinsSnapshot.size,
                linkedDevices: devicesSnapshot.size,
                missingObjects: allObjects.filter((item) => item.status === 'missing').length
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            throw error;
        }
    }

    // Device management methods
    async getDeviceTokens(objectId = null) {
        try {
            let q = collection(this.db, 'fcm_tokens');
            
            if (objectId) {
                q = query(q, where('objectId', '==', objectId));
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

    // Object management methods
    async getObjects() {
        try {
            const usersSnapshot = await this.getCollection('users');
            const allObjects = [];

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();

                try {
                    const objectsRef = collection(this.db, 'users', userId, 'objects');
                    const objectsSnapshot = await getDocs(objectsRef);
                    objectsSnapshot.docs.forEach((objectDoc) => {
                        allObjects.push({
                            id: objectDoc.id,
                            userId,
                            userDisplayName: userData.displayName || userData.email,
                            userUrlName: userData.urlName,
                            ...objectDoc.data()
                        });
                    });
                } catch (error) {
                    console.warn(`Could not fetch objects for user ${userId}:`, error);
                }
            }

            return allObjects;
        } catch (error) {
            console.error('Error getting objects:', error);
            throw error;
        }
    }

    async addObject(objectData) {
        try {
            const { userId, ...objectFields } = objectData;
            if (!userId) {
                throw new Error('userId is required to create an object');
            }
            const objectsRef = collection(this.db, 'users', userId, 'objects');
            return await addDoc(objectsRef, {
                ...objectFields,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Error adding object:', error);
            throw error;
        }
    }

    async updateObject(objectId, objectData) {
        try {
            const allObjects = await this.getObjects();
            const objectEntry = allObjects.find((item) => item.id === objectId);
            if (!objectEntry) {
                throw new Error(`Object with ID ${objectId} not found`);
            }
            return await this.updateDocument(`users/${objectEntry.userId}/objects`, objectId, {
                ...objectData,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating object:', error);
            throw error;
        }
    }

    async deleteObject(objectId) {
        try {
            const allObjects = await this.getObjects();
            const objectEntry = allObjects.find((item) => item.id === objectId);
            if (!objectEntry) {
                throw new Error(`Object with ID ${objectId} not found`);
            }
            return await this.deleteDocument(`users/${objectEntry.userId}/objects`, objectId);
        } catch (error) {
            console.error('Error deleting object:', error);
            throw error;
        }
    }

    async getObject(objectId) {
        const allObjects = await this.getObjects();
        return allObjects.find((item) => item.id === objectId) || null;
    }

    // Temporary aliases while cutover is being wired through UI components.
    async getPets() {
        return this.getObjects();
    }

    async addPet(petData) {
        return this.addObject(petData);
    }

    async updatePet(petId, petData) {
        return this.updateObject(petId, petData);
    }

    async deletePet(petId) {
        return this.deleteObject(petId);
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
} 