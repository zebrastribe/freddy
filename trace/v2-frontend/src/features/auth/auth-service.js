import { auth } from '../../shared/firebase.js'

export class AuthService {
  constructor() {
    this.currentUser = null
    this.authStateListeners = []
  }

  async initialize() {
    console.log('🔐 Initializing Auth Service...')
    // TODO: Implement auth initialization
  }

  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback)
  }

  setDevelopmentUser() {
    // TODO: Implement development user bypass
    console.log('🔑 Setting development user')
  }
} 